import 'package:flutter/material.dart';

import '../models/patient.dart';
import '../services/api_client.dart';
import '../services/hybrid_data_service.dart';
import 'patient_detail_screen.dart';

class PatientsScreen extends StatefulWidget {
  const PatientsScreen({super.key});

  @override
  State<PatientsScreen> createState() => _PatientsScreenState();
}

class _PatientsScreenState extends State<PatientsScreen> {
  final List<Patient> _patients = [];
  final Set<String> _selectedIds = {};
  bool _loading = true;
  bool _syncing = false;
  bool _selectionMode = false;
  bool _deleting = false;

  bool get _allSelected =>
      _patients.isNotEmpty && _selectedIds.length == _patients.length;

  @override
  void initState() {
    super.initState();
    _loadPatients();
  }

  Future<void> _loadPatients() async {
    setState(() => _loading = true);
    try {
      final patients = await HybridDataService.instance.fetchPatients();
      if (!mounted) return;
      setState(() {
        _patients
          ..clear()
          ..addAll(patients);
        _selectedIds.removeWhere((id) => !_patients.any((p) => p.id == id));
        _loading = false;
      });
    } on ApiException catch (error) {
      _handleError('Failed to load patients: ${error.message}');
    } catch (error) {
      _handleError('Failed to load patients: $error');
    }
  }

  Future<void> _syncPatients() async {
    if (_syncing) return;
    setState(() => _syncing = true);
    try {
      final synced = await HybridDataService.instance.syncPatients();
      if (!mounted) return;
      setState(() {
        _patients
          ..clear()
          ..addAll(synced);
        _syncing = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Patients synced with server')),
      );
    } on ApiException catch (error) {
      _handleError('Patient sync failed: ${error.message}');
    } catch (error) {
      _handleError('Patient sync failed: $error');
    }
  }

  Future<void> _openRegistrationSheet() async {
    final result = await showModalBottomSheet<Patient>(
      context: context,
      isScrollControlled: true,
      builder: (context) => const _PatientRegistrationSheet(),
    );
    if (result != null) {
      await HybridDataService.instance.registerPatient(result);
      await _loadPatients();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Queued ${result.fullName} for sync')),
        );
      }
    }
  }

  Future<void> _openPatientDetails(Patient patient) async {
    if (_selectionMode) {
      _toggleSelected(patient.id);
      return;
    }
    await Navigator.of(context).push(
      MaterialPageRoute(builder: (context) => PatientDetailScreen(patient: patient)),
    );
    await _loadPatients();
  }

  Future<void> _editPatient(Patient patient) async {
    final result = await showModalBottomSheet<Patient>(
      context: context,
      isScrollControlled: true,
      builder: (context) => PatientEditSheet(patient: patient),
    );
    if (result != null) {
      await _loadPatients();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Updated ${result.fullName}')),
      );
    }
  }

  Future<void> _confirmDelete(Patient patient) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete patient?'),
        content: Text(
          'Remove ${patient.fullName} from GoDaddy backend and this device?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red.shade700),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await HybridDataService.instance.deletePatient(patient.id);
      await _loadPatients();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Deleted ${patient.fullName}')),
      );
    } on ApiException catch (error) {
      await _loadPatients();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.message)),
      );
    } catch (error) {
      _handleError('Delete failed: $error');
    }
  }

  void _enterSelectionMode({String? initialId}) {
    setState(() {
      _selectionMode = true;
      _selectedIds.clear();
      if (initialId != null) {
        _selectedIds.add(initialId);
      }
    });
  }

  void _exitSelectionMode() {
    setState(() {
      _selectionMode = false;
      _selectedIds.clear();
    });
  }

  void _toggleSelected(String id) {
    setState(() {
      if (_selectedIds.contains(id)) {
        _selectedIds.remove(id);
      } else {
        _selectedIds.add(id);
      }
    });
  }

  void _selectAll() {
    setState(() {
      _selectedIds
        ..clear()
        ..addAll(_patients.map((p) => p.id));
    });
  }

  void _clearSelection() {
    setState(() => _selectedIds.clear());
  }

  Future<void> _confirmDeleteSelected() async {
    if (_selectedIds.isEmpty) return;
    final count = _selectedIds.length;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(count == _patients.length ? 'Delete all patients?' : 'Delete selected?'),
        content: Text(
          count == _patients.length
              ? 'Delete all $count patients from GoDaddy and this device? This cannot be undone.'
              : 'Delete $count selected patient${count == 1 ? '' : 's'} from GoDaddy and this device?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red.shade700),
            onPressed: () => Navigator.pop(context, true),
            child: Text(count == _patients.length ? 'Delete all' : 'Delete $count'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    setState(() => _deleting = true);
    final ids = _selectedIds.toList();
    try {
      final result = await HybridDataService.instance.deletePatients(ids);
      await _loadPatients();
      if (!mounted) return;
      _exitSelectionMode();
      final msg = result.failed == 0
          ? 'Deleted ${result.deleted} patient${result.deleted == 1 ? '' : 's'}'
          : 'Deleted ${result.deleted}, ${result.failed} failed (check connection)';
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
    } catch (error) {
      _handleError('Bulk delete failed: $error');
    } finally {
      if (mounted) setState(() => _deleting = false);
    }
  }

  void _handleError(String message) {
    if (!mounted) return;
    setState(() {
      _loading = false;
      _syncing = false;
      _deleting = false;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        if (_selectionMode)
          _SelectionToolbar(
            selectedCount: _selectedIds.length,
            totalCount: _patients.length,
            allSelected: _allSelected,
            deleting: _deleting,
            onSelectAll: _allSelected ? _clearSelection : _selectAll,
            onDelete: _confirmDeleteSelected,
            onCancel: _exitSelectionMode,
          )
        else
          _PatientsToolbar(
            onAdd: _openRegistrationSheet,
            onRefresh: _syncPatients,
            refreshing: _syncing,
            onSelect: _patients.isEmpty ? null : () => _enterSelectionMode(),
          ),
        const Divider(height: 1),
        if (_loading || _deleting) const LinearProgressIndicator(minHeight: 3),
        Expanded(
          child: _patients.isEmpty
              ? (_loading
                  ? const Center(child: Text('Loading patients from GoDaddy…'))
                  : const _EmptyPatientState())
              : RefreshIndicator(
                  onRefresh: _selectionMode ? () async {} : _syncPatients,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _patients.length,
                    itemBuilder: (context, index) {
                      final patient = _patients[index];
                      final selected = _selectedIds.contains(patient.id);
                      return _PatientListTile(
                        patient: patient,
                        selectionMode: _selectionMode,
                        selected: selected,
                        onTap: () => _openPatientDetails(patient),
                        onLongPress: () {
                          if (!_selectionMode) {
                            _enterSelectionMode(initialId: patient.id);
                          }
                        },
                        onToggleSelect: () => _toggleSelected(patient.id),
                        onEdit: () => _editPatient(patient),
                        onDelete: () => _confirmDelete(patient),
                      );
                    },
                  ),
                ),
        ),
      ],
    );
  }
}

class _PatientsToolbar extends StatelessWidget {
  const _PatientsToolbar({
    required this.onAdd,
    required this.onRefresh,
    required this.refreshing,
    this.onSelect,
  });

  final VoidCallback onAdd;
  final VoidCallback onRefresh;
  final bool refreshing;
  final VoidCallback? onSelect;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Expanded(
            child: Text(
              'Patients',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
          ),
          if (onSelect != null)
            IconButton(
              tooltip: 'Select patients to delete',
              onPressed: onSelect,
              icon: const Icon(Icons.checklist),
            ),
          IconButton(
            tooltip: 'Sync patients',
            onPressed: refreshing ? null : onRefresh,
            icon: refreshing
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.sync),
          ),
          const SizedBox(width: 8),
          FilledButton.icon(
            onPressed: onAdd,
            icon: const Icon(Icons.person_add),
            label: const Text('Register'),
          ),
        ],
      ),
    );
  }
}

class _SelectionToolbar extends StatelessWidget {
  const _SelectionToolbar({
    required this.selectedCount,
    required this.totalCount,
    required this.allSelected,
    required this.deleting,
    required this.onSelectAll,
    required this.onDelete,
    required this.onCancel,
  });

  final int selectedCount;
  final int totalCount;
  final bool allSelected;
  final bool deleting;
  final VoidCallback onSelectAll;
  final VoidCallback onDelete;
  final VoidCallback onCancel;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Theme.of(context).colorScheme.primaryContainer,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
        child: Row(
          children: [
            IconButton(
              tooltip: 'Cancel selection',
              onPressed: deleting ? null : onCancel,
              icon: const Icon(Icons.close),
            ),
            Expanded(
              child: Text(
                selectedCount == 0
                    ? 'Select patients'
                    : '$selectedCount of $totalCount selected',
                style: Theme.of(context).textTheme.titleMedium,
              ),
            ),
            TextButton(
              onPressed: deleting ? null : onSelectAll,
              child: Text(allSelected ? 'Clear' : 'Select all'),
            ),
            const SizedBox(width: 4),
            FilledButton.icon(
              style: FilledButton.styleFrom(
                backgroundColor: Colors.red.shade700,
              ),
              onPressed: deleting || selectedCount == 0 ? null : onDelete,
              icon: deleting
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Icon(Icons.delete),
              label: Text(
                selectedCount == totalCount && totalCount > 0
                    ? 'Delete all'
                    : 'Delete',
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PatientListTile extends StatelessWidget {
  const _PatientListTile({
    required this.patient,
    required this.selectionMode,
    required this.selected,
    required this.onTap,
    required this.onLongPress,
    required this.onToggleSelect,
    required this.onEdit,
    required this.onDelete,
  });

  final Patient patient;
  final bool selectionMode;
  final bool selected;
  final VoidCallback onTap;
  final VoidCallback onLongPress;
  final VoidCallback onToggleSelect;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final color = patient.riskColor;
    return Card(
      elevation: 0,
      color: selected ? Theme.of(context).colorScheme.primaryContainer.withOpacity(0.35) : null,
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        onLongPress: onLongPress,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (selectionMode)
                    Checkbox(
                      value: selected,
                      onChanged: (_) => onToggleSelect(),
                    )
                  else
                    CircleAvatar(
                      backgroundColor: color.withOpacity(0.1),
                      child: Text(patient.initials, style: TextStyle(color: color)),
                    ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          patient.fullName,
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        const SizedBox(height: 4),
                        Text('${patient.age} • ${patient.gender}'),
                        const SizedBox(height: 2),
                        Text('Last assessment ${patient.lastAssessment}'),
                      ],
                    ),
                  ),
                  if (!selectionMode)
                    PopupMenuButton<String>(
                      tooltip: 'Patient actions',
                      onSelected: (value) {
                        switch (value) {
                          case 'view':
                            onTap();
                          case 'edit':
                            onEdit();
                          case 'select':
                            onLongPress();
                          case 'delete':
                            onDelete();
                        }
                      },
                      itemBuilder: (context) => const [
                        PopupMenuItem(value: 'view', child: Text('Open')),
                        PopupMenuItem(value: 'edit', child: Text('Edit')),
                        PopupMenuItem(value: 'select', child: Text('Select…')),
                        PopupMenuItem(
                          value: 'delete',
                          child: Text('Delete', style: TextStyle(color: Colors.red)),
                        ),
                      ],
                    ),
                ],
              ),
              if (!selectionMode) ...[
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 4,
                  children: [
                    Chip(
                      backgroundColor: color.withOpacity(0.12),
                      label: Text(
                        patient.riskLevel,
                        style: TextStyle(color: color, fontWeight: FontWeight.w600),
                      ),
                    ),
                    Text(
                      'Score ${patient.healthScore}',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    Text(
                      patient.statusLabel,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: patient.status == PatientStatus.pendingUpload
                                ? Colors.orange.shade700
                                : patient.status == PatientStatus.error
                                    ? Colors.red.shade600
                                    : Colors.green.shade600,
                          ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    TextButton.icon(
                      onPressed: onTap,
                      icon: const Icon(Icons.visibility, size: 18),
                      label: const Text('Open'),
                    ),
                    TextButton.icon(
                      onPressed: onEdit,
                      icon: const Icon(Icons.edit, size: 18),
                      label: const Text('Edit'),
                    ),
                    TextButton.icon(
                      onPressed: onDelete,
                      icon: Icon(Icons.delete_outline, size: 18, color: Colors.red.shade700),
                      label: Text('Delete', style: TextStyle(color: Colors.red.shade700)),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _EmptyPatientState extends StatelessWidget {
  const _EmptyPatientState();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.folder_open, size: 64, color: Colors.grey.shade400),
          const SizedBox(height: 16),
          Text('No patient records yet', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          Text(
            'Patients will appear after hybrid sync completes or when you register a new patient offline.',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ],
      ),
    );
  }
}

class _PatientRegistrationSheet extends StatefulWidget {
  const _PatientRegistrationSheet();

  @override
  State<_PatientRegistrationSheet> createState() => _PatientRegistrationSheetState();
}

class _PatientRegistrationSheetState extends State<_PatientRegistrationSheet> {
  final _formKey = GlobalKey<FormState>();

  String _firstName = '';
  String _lastName = '';
  String _email = '';
  String _phone = '';
  String _volunteerSupport = '';

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.only(bottom: bottomInset, left: 16, right: 16, top: 24),
      child: SafeArea(
        top: false,
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade400,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text('Register Patient', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 16),
              TextFormField(
                decoration: const InputDecoration(labelText: 'First name'),
                validator: (value) => value == null || value.isEmpty ? 'Required' : null,
                onSaved: (value) => _firstName = value ?? '',
              ),
              const SizedBox(height: 12),
              TextFormField(
                decoration: const InputDecoration(labelText: 'Last name'),
                validator: (value) => value == null || value.isEmpty ? 'Required' : null,
                onSaved: (value) => _lastName = value ?? '',
              ),
              const SizedBox(height: 12),
              TextFormField(
                decoration: const InputDecoration(labelText: 'Email'),
                keyboardType: TextInputType.emailAddress,
                onSaved: (value) => _email = value ?? '',
              ),
              const SizedBox(height: 12),
              TextFormField(
                decoration: const InputDecoration(labelText: 'Phone'),
                keyboardType: TextInputType.phone,
                onSaved: (value) => _phone = value ?? '',
              ),
              const SizedBox(height: 12),
              TextFormField(
                decoration: const InputDecoration(
                  labelText: 'Volunteer Support (optional)',
                  hintText: 'Name of volunteer assisting this patient',
                ),
                onSaved: (value) => _volunteerSupport = value ?? '',
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: _handleSubmit,
                  icon: const Icon(Icons.save),
                  label: const Text('Save & Sync'),
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  void _handleSubmit() {
    if (_formKey.currentState?.validate() != true) return;
    _formKey.currentState?.save();
    final patient = Patient(
      id: DateTime.now().microsecondsSinceEpoch.toString(),
      firstName: _firstName,
      lastName: _lastName,
      gender: 'Unknown',
      age: 0,
      healthScore: 70,
      riskLevel: 'Pending Assessment',
      lastAssessment: 'Awaiting sync',
      email: _email.isEmpty ? null : _email,
      phone: _phone.isEmpty ? null : _phone,
      volunteerSupport: _volunteerSupport.isEmpty ? null : _volunteerSupport,
      status: PatientStatus.pendingUpload,
    );
    Navigator.of(context).pop(patient);
  }
}
