import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:retry/retry.dart';

class ApiException implements Exception {
  ApiException({
    this.statusCode,
    required this.message,
    this.errors,
    this.uri,
    this.cause,
  });

  final int? statusCode;
  final String message;
  final Map<String, dynamic>? errors;
  final Uri? uri;
  final Object? cause;

  @override
  String toString() {
    final buffer = StringBuffer('ApiException: $message');
    if (statusCode != null) {
      buffer.write(' (status: $statusCode)');
    }
    if (uri != null) {
      buffer.write(' [uri: $uri]');
    }
    if (errors != null && errors!.isNotEmpty) {
      buffer.write(' errors=$errors');
    }
    if (cause != null) {
      buffer.write(' cause=$cause');
    }
    return buffer.toString();
  }
}

class HealthApiClient {
  HealthApiClient({
    required String baseUrl,
    http.Client? httpClient,
    RetryOptions? retryOptions,
  })  : _baseUri = _ensureTrailingSlash(baseUrl),
        _client = httpClient ?? http.Client(),
        _retry = retryOptions ?? const RetryOptions(maxAttempts: 3);

  final Uri _baseUri;
  final http.Client _client;
  final RetryOptions _retry;

  String? _token;

  static Uri _ensureTrailingSlash(String baseUrl) {
    final uri = Uri.parse(baseUrl);
    if (uri.path.endsWith('/')) {
      return uri;
    }
    return uri.replace(path: '${uri.path}/');
  }

  String? get token => _token;

  void updateToken(String? token) {
    _token = token;
  }

  Future<Map<String, dynamic>> getJson(
    String path, {
    Map<String, String>? queryParameters,
    Map<String, String>? headers,
  }) {
    return _send(
      method: 'GET',
      path: path,
      queryParameters: queryParameters,
      headers: headers,
    );
  }

  Future<Map<String, dynamic>> postJson(
    String path, {
    Object? body,
    Map<String, String>? headers,
  }) {
    return _send(
      method: 'POST',
      path: path,
      body: body,
      headers: headers,
    );
  }

  Future<Map<String, dynamic>> putJson(
    String path, {
    Object? body,
    Map<String, String>? headers,
  }) {
    return _send(
      method: 'PUT',
      path: path,
      body: body,
      headers: headers,
    );
  }

  Future<Map<String, dynamic>> patchJson(
    String path, {
    Object? body,
    Map<String, String>? headers,
  }) {
    return _send(
      method: 'PATCH',
      path: path,
      body: body,
      headers: headers,
    );
  }

  Future<Map<String, dynamic>> deleteJson(
    String path, {
    Object? body,
    Map<String, String>? headers,
  }) {
    return _send(
      method: 'DELETE',
      path: path,
      body: body,
      headers: headers,
    );
  }

  /// GET that may return a bare JSON list (e.g. `/lab/tests/`).
  Future<List<dynamic>> getJsonList(
    String path, {
    Map<String, String>? queryParameters,
    Map<String, String>? headers,
  }) async {
    final uri = _buildUri(path, queryParameters);
    final requestHeaders = <String, String>{
      'Accept': 'application/json',
      if (_token != null && _token!.isNotEmpty) 'Authorization': 'Token $_token',
      if (headers != null) ...headers,
    };

    final response = await _retry.retry(
      () => _client.get(uri, headers: requestHeaders),
      retryIf: (exception) =>
          exception is http.ClientException ||
          exception.toString().contains('SocketException'),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiException(
        statusCode: response.statusCode,
        message: 'Request failed',
        uri: uri,
      );
    }
    if (response.body.isEmpty) return const [];
    final decoded = jsonDecode(response.body);
    if (decoded is List) return decoded;
    if (decoded is Map<String, dynamic>) {
      final data = decoded['data'] ?? decoded['results'];
      if (data is List) return data;
    }
    throw ApiException(message: 'Expected JSON list', uri: uri);
  }

  Future<Map<String, dynamic>> _send({
    required String method,
    required String path,
    Object? body,
    Map<String, String>? queryParameters,
    Map<String, String>? headers,
  }) async {
    final uri = _buildUri(path, queryParameters);

    final requestHeaders = <String, String>{
      'Accept': 'application/json',
      if (body != null) 'Content-Type': 'application/json; charset=utf-8',
      if (_token != null && _token!.isNotEmpty) 'Authorization': 'Token $_token',
      if (headers != null) ...headers,
    };

    final response = await _retry.retry(
      () => _dispatch(method, uri, requestHeaders, body),
      retryIf: (exception) =>
          exception is http.ClientException ||
          exception.toString().contains('SocketException'),
    );

    return _parseResponse(response, uri);
  }

  Future<http.Response> _dispatch(
    String method,
    Uri uri,
    Map<String, String> headers,
    Object? body,
  ) {
    switch (method.toUpperCase()) {
      case 'GET':
        return _client.get(uri, headers: headers);
      case 'POST':
        return _client.post(uri, headers: headers, body: _encodeBody(body));
      case 'PUT':
        return _client.put(uri, headers: headers, body: _encodeBody(body));
      case 'PATCH':
        return _client.patch(uri, headers: headers, body: _encodeBody(body));
      case 'DELETE':
        return _client.delete(uri, headers: headers, body: _encodeBody(body));
      default:
        throw ArgumentError.value(method, 'method', 'Unsupported HTTP method');
    }
  }

  Uri _buildUri(String path, Map<String, String>? queryParameters) {
    final trimmed = path.startsWith('/') ? path.substring(1) : path;
    final uri = _baseUri.resolve(trimmed);
    if (queryParameters == null || queryParameters.isEmpty) {
      return uri;
    }
    return uri.replace(queryParameters: {
      ...uri.queryParameters,
      ...queryParameters,
    });
  }

  static String? _encodeBody(Object? body) {
    if (body == null) return null;
    if (body is String) return body;
    return jsonEncode(body);
  }

  Map<String, dynamic> _parseResponse(http.Response response, Uri uri) {
    Map<String, dynamic> parseJsonBody() {
      if (response.body.isEmpty) {
        return const {};
      }
      final decoded = jsonDecode(response.body);
      if (decoded is Map<String, dynamic>) {
        return decoded;
      }
      return {'data': decoded};
    }

    final statusCode = response.statusCode;
    final body = parseJsonBody();

    if (statusCode >= 200 && statusCode < 300) {
      return body;
    }

    throw ApiException(
      statusCode: statusCode,
      message: body['message'] as String? ?? 'Request failed',
      errors: body['errors'] is Map<String, dynamic>
          ? body['errors'] as Map<String, dynamic>
          : null,
      uri: uri,
    );
  }

  void close() {
    _client.close();
  }
}
