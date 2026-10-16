import 'dart:async';

import 'package:flutter/material.dart';

import '../models/volunteer.dart';
import '../services/api_client.dart';
import '../services/hybrid_data_service.dart';

class VolunteersScreen extends StatefulWidget {
  const VolunteersScreen({super.key, this.ownEmailOnly, this.ownId});

  final String? ownEmailOnly;
  final String? ownId;

  @override
  State<VolunteersScreen> createState() => _VolunteersScreenState();
}

class _VolunteersScreenState extends State<VolunteersScreen> {
  final List<Volunteer> _volunteers = [];
  bool _loading = true;
  bool _syncing = false;

  @override
  void initState() {
    super.initState();
    _loadVolunteers();
  }

  List<Volunteer> _scopeOwn(List<Volunteer> list) {
    final email = widget.ownEmailOnly?.trim().toLowerCase();
    final id = widget.ownId;
    if (email == null && id == null) return list;
    return list.where((v) {
      if (id != null && v.id == id) return true;
      if (email != null && (v.email ?? '').trim().toLowerCase() == email) {
        return true;
      }
      return false;
    }).toList();
  }

  Future<void> _loadVolunteers() async {
    setState(() => _loading = true);
    try {
      final volunteers =
          _scopeOwn(await HybridDataService.instance.fetchVolunteers());
      if (!mounted) return;
      setState(() {
        _volunteers
          ..clear()
          ..addAll(volunteers);
        _loading = false;
      });
    } on ApiException catch (error) {
      _handleError('Failed to load volunteers: ${error.message}');
    } catch (error) {
      _handleError('Failed to load volunteers: $error');
    }
  }

  Future<void> _syncVolunteers() async {
    if (_syncing) return;
    setState(() => _syncing = true);
    try {
      final synced = await HybridDataService.instance.syncVolunteers();
      if (!mounted) return;
      setState(() {
        _volunteers
          ..clear()
          ..addAll(synced);
        _syncing = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Volunteer sync finished (local hybrid — /api/volunteers/ not on server yet)',
          ),
        ),
      );
    } on ApiException catch (error) {
      _handleError('Volunteer sync failed: ${error.message}');
    } catch (error) {
      _handleError('Volunteer sync failed: $error');
    }
  }

  Future<void> _openRegistrationSheet() async {
    final result = await showModalBottomSheet<Volunteer>(
      context: context,
      isScrollControlled: true,
      builder: (context) => const VolunteerRegistrationSheet(),
    );
    if (result != null) {
      await HybridDataService.instance.registerVolunteer(result);
      await _loadVolunteers();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Saved ${result.fullName}. Sync when online.')),
        );
      }
    }
  }

  void _openVolunteerDetails(Volunteer volunteer) {
    showDialog<void>(
      context: context,
      builder: (context) => VolunteerDetailsDialog(volunteer: volunteer),
    );
  }

  void _handleError(String message) {
    if (!mounted) return;
    setState(() {
      _loading = false;
      _syncing = false;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _VolunteersToolbar(
          onAdd: _openRegistrationSheet,
          onRefresh: _syncVolunteers,
          refreshing: _syncing,
        ),
        const Divider(height: 1),
        if (_loading) const LinearProgressIndicator(minHeight: 3),
        Expanded(
          child: _volunteers.isEmpty
              ? (_loading
                  ? const Center(child: Text('Loading volunteers…'))
                  : const _EmptyVolunteerState())
              : RefreshIndicator(
                  onRefresh: _syncVolunteers,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _volunteers.length,
                    itemBuilder: (context, index) {
                      final volunteer = _volunteers[index];
                      return VolunteerCard(
                        volunteer: volunteer,
                        onTap: () => _openVolunteerDetails(volunteer),
                      );
                    },
                  ),
                ),
        ),
      ],
    );
  }
}

class _VolunteersToolbar extends StatelessWidget {
  const _VolunteersToolbar({
    required this.onAdd,
    required this.onRefresh,
    required this.refreshing,
  });

  final VoidCallback onAdd;
  final VoidCallback onRefresh;
  final bool refreshing;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Expanded(
            child: Text(
              'Volunteers',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
            ),
          ),
          IconButton(
            tooltip: 'Sync volunteers',
            onPressed: refreshing ? null : onRefresh,
            icon: refreshing
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                : const Icon(Icons.sync),
          ),
          const SizedBox(width: 8),
          FilledButton.icon(
            onPressed: onAdd,
            icon: const Icon(Icons.volunteer_activism),
            label: const Text('Register'),
          ),
        ],
      ),
    );
  }
}

class VolunteerCard extends StatelessWidget {
  const VolunteerCard({required this.volunteer, required this.onTap});

  final Volunteer volunteer;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = volunteer.statusColor;
    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: color.withOpacity(0.12),
          child: Text(
            volunteer.initials,
            style: TextStyle(color: color, fontWeight: FontWeight.w600),
          ),
        ),
        title: Text(
          volunteer.fullName,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              '${volunteer.organization} • ${volunteer.role}',
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 4),
            Text(
              volunteer.availability,
              style: Theme.of(context).textTheme.bodySmall,
            ),
            if (volunteer.contactSummary != 'No contact info') ...[
              const SizedBox(height: 4),
              Text(
                volunteer.contactSummary,
                style: Theme.of(context).textTheme.bodySmall,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ],
        ),
        trailing: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Chip(
              backgroundColor: color.withOpacity(0.12),
              label: Text(
                volunteer.status.name.toUpperCase(),
                style: TextStyle(color: color),
              ),
            ),
            if (volunteer.contactSummary == 'No contact info') ...[
              const SizedBox(height: 4),
              Text(
                'No contact info',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ],
        ),
        isThreeLine: true,
        onTap: onTap,
      ),
    );
  }
}

class VolunteerRegistrationSheet extends StatefulWidget {
  const VolunteerRegistrationSheet();

  @override
  State<VolunteerRegistrationSheet> createState() => _VolunteerRegistrationSheetState();
}

class _VolunteerRegistrationSheetState extends State<VolunteerRegistrationSheet> {
  final _formKey = GlobalKey<FormState>();

  String _fullName = '';
  String _email = '';
  String _phone = '';
  String _organization = 'Independent Volunteer';
  String _role = '';
  String _availability = '';
  String _skills = '';

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.only(bottom: bottomInset, left: 16, right: 16, top: 24),
      child: SafeArea(
        top: false,
        child: Form(
          key: _formKey,
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Center(
                  child: Container(
                    width: 36,
                    height: 4,
                    decoration: BoxDecoration(color: Colors.grey.shade400, borderRadius: BorderRadius.circular(2)),
                  ),
                ),
                const SizedBox(height: 16),
                Text('Register Volunteer', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 16),
                TextFormField(
                  decoration: const InputDecoration(labelText: 'Full name'),
                  validator: (value) => value == null || value.isEmpty ? 'Required' : null,
                  onSaved: (value) => _fullName = value?.trim() ?? '',
                ),
                const SizedBox(height: 12),
                TextFormField(
                  decoration: const InputDecoration(labelText: 'Email'),
                  keyboardType: TextInputType.emailAddress,
                  onSaved: (value) => _email = value?.trim() ?? '',
                ),
                const SizedBox(height: 12),
                TextFormField(
                  decoration: const InputDecoration(labelText: 'Phone'),
                  keyboardType: TextInputType.phone,
                  onSaved: (value) => _phone = value?.trim() ?? '',
                ),
                const SizedBox(height: 12),
                TextFormField(
                  decoration: const InputDecoration(labelText: 'Organization'),
                  initialValue: _organization,
                  onSaved: (value) => _organization =
                      value == null || value.trim().isEmpty ? 'Independent Volunteer' : value.trim(),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  decoration: const InputDecoration(labelText: 'Role / Assignment'),
                  onSaved: (value) => _role = value?.trim() ?? '',
                ),
                const SizedBox(height: 12),
                TextFormField(
                  decoration: const InputDecoration(labelText: 'Availability'),
                  onSaved: (value) => _availability = value?.trim() ?? '',
                ),
                const SizedBox(height: 12),
                TextFormField(
                  decoration: const InputDecoration(labelText: 'Skills (comma separated)'),
                  onSaved: (value) => _skills = value?.trim() ?? '',
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: _handleSubmit,
                    icon: const Icon(Icons.save),
                    label: const Text('Save Volunteer'),
                  ),
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _handleSubmit() {
    if (_formKey.currentState?.validate() != true) return;
    _formKey.currentState?.save();
    final volunteer = Volunteer(
      id: DateTime.now().microsecondsSinceEpoch.toString(),
      fullName: _fullName,
      organization: _organization,
      role: _role.isEmpty ? 'General Support' : _role,
      availability: _availability.isEmpty ? 'TBD' : _availability,
      email: _email.isEmpty ? null : _email,
      phone: _phone.isEmpty ? null : _phone,
      skills: _skills.isEmpty ? null : _skills,
      status: VolunteerStatus.pendingUpload,
    );
    Navigator.of(context).pop(volunteer);
  }
}

class VolunteerDetailsDialog extends StatelessWidget {
  const VolunteerDetailsDialog({required this.volunteer});

  final Volunteer volunteer;

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(volunteer.fullName),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _DetailRow(label: 'Organization', value: volunteer.organization),
          _DetailRow(label: 'Role', value: volunteer.role),
          _DetailRow(label: 'Availability', value: volunteer.availability),
          _DetailRow(label: 'Skills', value: volunteer.skills ?? 'Not listed'),
          _DetailRow(label: 'Email', value: volunteer.email ?? 'n/a'),
          _DetailRow(label: 'Phone', value: volunteer.phone ?? 'n/a'),
          _DetailRow(label: 'Status', value: volunteer.status.name.toUpperCase()),
        ],
      ),
      actions: [
        TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('Close')),
        FilledButton(
          onPressed: () {
            Navigator.of(context).pop();
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Edit flow for ${volunteer.fullName} coming soon')),
            );
          },
          child: const Text('Edit'),
        ),
      ],
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          SizedBox(
            width: 130,
            child: Text(
              label,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
            ),
          ),
          Expanded(child: Text(value, style: Theme.of(context).textTheme.bodyMedium)),
        ],
      ),
    );
  }
}

class _EmptyVolunteerState extends StatelessWidget {
  const _EmptyVolunteerState();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.volunteer_activism, size: 64, color: Colors.grey.shade400),
          const SizedBox(height: 16),
          Text('No volunteers yet', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          Text(
            'Registrations captured in the field will sync here automatically or can be entered manually.',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ],
      ),
    );
  }
}

