import React, { useState } from 'react';
import { Plus, Edit, Trash2, Clock, Copy, Check, X } from 'lucide-react';
import Button from './Button';

type TimeSlot = { start: string; end: string };
type AvailabilityState = Record<string, TimeSlot[]>;

interface AvailabilitySchedulerProps {
  availability: AvailabilityState;
  onAvailabilityChange: (availability: AvailabilityState) => Promise<void> | void;
}

const DAYS = [
  { key: 'Mo', label: 'Montag' },
  { key: 'Di', label: 'Dienstag' },
  { key: 'Mi', label: 'Mittwoch' },
  { key: 'Do', label: 'Donnerstag' },
  { key: 'Fr', label: 'Freitag' },
  { key: 'Sa', label: 'Samstag' },
  { key: 'So', label: 'Sonntag' },
];

const QUICK_TIMES = [
  { label: 'Vormittag', start: '08:00', end: '12:00' },
  { label: 'Nachmittag', start: '13:00', end: '17:00' },
  { label: 'Ganzer Tag', start: '08:00', end: '18:00' },
  { label: 'Abend', start: '18:00', end: '21:00' },
];

function AvailabilityScheduler({ availability, onAvailabilityChange }: AvailabilitySchedulerProps) {
  const [editSlot, setEditSlot] = useState<{ day: string; idx: number | null }>({ day: '', idx: null });
  const [slotDraft, setSlotDraft] = useState<TimeSlot>({ start: '', end: '' });
  const [validationError, setValidationError] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Zeit-Validierung: Überprüft Überschneidungen
  const validateTimeSlot = (day: string, newSlot: TimeSlot, excludeIdx?: number): string => {
    const slots = availability[day] || [];
    const start = new Date(`2000-01-01T${newSlot.start}`);
    const end = new Date(`2000-01-01T${newSlot.end}`);

    // Grundvalidierung
    if (start >= end) {
      return 'Startzeit muss vor der Endzeit liegen';
    }

    // Überschneidung prüfen
    for (let i = 0; i < slots.length; i++) {
      if (excludeIdx !== undefined && i === excludeIdx) continue;
      
      const existingStart = new Date(`2000-01-01T${slots[i].start}`);
      const existingEnd = new Date(`2000-01-01T${slots[i].end}`);

      if (
        (start < existingEnd && end > existingStart) || 
        (existingStart < end && existingEnd > start)
      ) {
        return 'Zeitblock überschneidet sich mit einem bestehenden Zeitblock';
      }
    }

    return '';
  };

  const handleAddSlot = (day: string) => {
    setEditSlot({ day, idx: null });
    setSlotDraft({ start: '09:00', end: '17:00' });
    setValidationError('');
  };

  const handleEditSlot = (day: string, idx: number) => {
    setEditSlot({ day, idx });
    setSlotDraft({ ...availability[day][idx] });
    setValidationError('');
  };

  const handleSaveSlot = async () => {
    const error = validateTimeSlot(editSlot.day, slotDraft, editSlot.idx ?? undefined);
    if (error) {
      setValidationError(error);
      return;
    }

    setSaving(true);
    try {
      const newAvailability = { ...availability };
      const slots = [...(newAvailability[editSlot.day] || [])];
      
      if (editSlot.idx === null) {
        slots.push(slotDraft);
      } else {
        slots[editSlot.idx] = slotDraft;
      }
      
      // Sortiere Zeitblöcke nach Startzeit
      slots.sort((a, b) => a.start.localeCompare(b.start));
      
      newAvailability[editSlot.day] = slots;
      await onAvailabilityChange(newAvailability);
      
      setEditSlot({ day: '', idx: null });
      setSlotDraft({ start: '', end: '' });
      setValidationError('');
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      setValidationError('Fehler beim Speichern. Bitte versuchen Sie es erneut.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlot = async (day: string, idx: number) => {
    setSaving(true);
    try {
      const newAvailability = { ...availability };
      const slots = [...(newAvailability[day] || [])];
      slots.splice(idx, 1);
      newAvailability[day] = slots;
      await onAvailabilityChange(newAvailability);
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditSlot({ day: '', idx: null });
    setSlotDraft({ start: '', end: '' });
    setValidationError('');
  };

  const handleQuickTime = (quickTime: typeof QUICK_TIMES[0]) => {
    setSlotDraft({ start: quickTime.start, end: quickTime.end });
    setValidationError('');
  };

  const handleCopyDay = async (fromDay: string, toDay: string) => {
    setSaving(true);
    try {
      const newAvailability = { ...availability };
      newAvailability[toDay] = [...(availability[fromDay] || [])];
      await onAvailabilityChange(newAvailability);
    } catch (error) {
      console.error('Fehler beim Kopieren:', error);
    } finally {
      setSaving(false);
    }
  };

  const formatTimeRange = (slot: TimeSlot) => {
    if (!slot || !slot.start || !slot.end) {
      return 'Fehlerhafte Zeit';
    }
    return `${slot.start} - ${slot.end}`;
  };

  const getTotalHours = (slots: TimeSlot[]) => {
    return slots.reduce((total, slot) => {
      if (!slot || !slot.start || !slot.end) return total;
      try {
        const start = new Date(`2000-01-01T${slot.start}`);
        const end = new Date(`2000-01-01T${slot.end}`);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return total;
        return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      } catch {
        return total;
      }
    }, 0);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-600 mb-4">
          Legen Sie fest, wann Sie regelmäßig für Termine zur Verfügung stehen. Sie können mehrere Zeitblöcke pro Tag hinzufügen.
        </p>
        {saving && (
          <div className="flex items-center gap-2 text-sm text-primary-600 mb-4">
            <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            Speichere Änderungen...
          </div>
        )}
      </div>

      {DAYS.map((dayInfo) => {
        const daySlots = availability[dayInfo.key] || [];
        const totalHours = daySlots.length > 0 ? getTotalHours(daySlots) : 0;
        
        return (
          <div key={dayInfo.key} className="border rounded-lg p-4 bg-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <h4 className="font-semibold text-gray-900">{dayInfo.label}</h4>
                {totalHours > 0 && (
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {totalHours.toFixed(1)}h gesamt
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAddSlot(dayInfo.key)}
                  leftIcon={<Plus className="h-4 w-4" />}
                  className="text-primary-600"
                  disabled={saving}
                >
                  Zeitblock hinzufügen
                </Button>
                {daySlots.length > 0 && (
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleCopyDay(dayInfo.key, e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                    defaultValue=""
                    disabled={saving}
                  >
                    <option value="">Kopieren nach...</option>
                    {DAYS.filter(d => d.key !== dayInfo.key).map(d => (
                      <option key={d.key} value={d.key}>{d.label}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {daySlots.length === 0 ? (
              <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nicht verfügbar</p>
              </div>
            ) : (
              <div className="space-y-2">
                {daySlots.map((slot, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-primary-50 border border-primary-200 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                      <span className="font-medium text-primary-900">
                        {formatTimeRange(slot)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditSlot(dayInfo.key, idx)}
                        className="p-1 text-primary-600 hover:bg-primary-100 rounded disabled:opacity-50"
                        title="Bearbeiten"
                        disabled={saving}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSlot(dayInfo.key, idx)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded disabled:opacity-50"
                        title="Löschen"
                        disabled={saving}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Inline-Editing */}
            {editSlot.day === dayInfo.key && (
              <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h5 className="font-medium mb-3">
                  {editSlot.idx === null ? 'Neuer Zeitblock' : 'Zeitblock bearbeiten'}
                </h5>
                
                {/* Quick Time Buttons */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {QUICK_TIMES.map((quickTime) => (
                    <button
                      key={quickTime.label}
                      onClick={() => handleQuickTime(quickTime)}
                      className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    >
                      {quickTime.label}
                    </button>
                  ))}
                </div>

                {/* Time Inputs */}
                <div className="flex items-center gap-4 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Von</label>
                    <input
                      type="time"
                      value={slotDraft.start}
                      onChange={(e) => setSlotDraft(d => ({ ...d, start: e.target.value }))}
                      className="input w-32"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bis</label>
                    <input
                      type="time"
                      value={slotDraft.end}
                      onChange={(e) => setSlotDraft(d => ({ ...d, end: e.target.value }))}
                      className="input w-32"
                    />
                  </div>
                </div>

                {/* Validation Error */}
                {validationError && (
                  <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    {validationError}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveSlot}
                    disabled={!slotDraft.start || !slotDraft.end || saving}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    {saving ? 'Speichere...' : 'Speichern'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 transition-colors"
                  >
                    <X className="h-4 w-4" />
                    Abbrechen
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default AvailabilityScheduler; 