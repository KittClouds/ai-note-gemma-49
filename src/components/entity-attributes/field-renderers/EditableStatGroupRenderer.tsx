import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Save, RotateCcw } from 'lucide-react';
import { StatBlockValue, STAT_SCHEMAS, StatSchema } from '@/types/attributes';

interface EditableStatGroupRendererProps {
  label: string;
  stats: StatBlockValue | any;
  onChange?: (stats: StatBlockValue) => void;
}

export function EditableStatGroupRenderer({ label, stats, onChange }: EditableStatGroupRendererProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingStats, setEditingStats] = useState<StatBlockValue>({});
  const [selectedSchema, setSelectedSchema] = useState<string>('');
  const [newStatName, setNewStatName] = useState('');
  const [newStatValue, setNewStatValue] = useState(10);

  // Normalize stats to StatBlockValue format
  const normalizedStats: StatBlockValue = React.useMemo(() => {
    if (!stats) return {};
    
    // Handle ProgressBar format (current/maximum) - convert to single value
    if (typeof stats === 'object' && stats.current !== undefined && stats.maximum !== undefined) {
      return { [label.toLowerCase()]: stats.current };
    }
    
    // Handle StatBlock format (object with string keys and number values)
    if (typeof stats === 'object' && stats !== null) {
      const result: StatBlockValue = {};
      Object.entries(stats).forEach(([key, value]) => {
        if (typeof value === 'number') {
          result[key] = value;
        }
      });
      return result;
    }
    
    return {};
  }, [stats, label]);

  const startEditing = () => {
    setEditingStats({ ...normalizedStats });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditingStats({});
    setIsEditing(false);
    setSelectedSchema('');
    setNewStatName('');
    setNewStatValue(10);
  };

  const saveChanges = () => {
    if (onChange) {
      onChange(editingStats);
    }
    setIsEditing(false);
    setSelectedSchema('');
    setNewStatName('');
    setNewStatValue(10);
  };

  const updateStatValue = (statName: string, value: number) => {
    setEditingStats(prev => ({
      ...prev,
      [statName]: value
    }));
  };

  const addNewStat = () => {
    if (newStatName.trim() && !editingStats[newStatName.trim()]) {
      setEditingStats(prev => ({
        ...prev,
        [newStatName.trim()]: newStatValue
      }));
      setNewStatName('');
      setNewStatValue(10);
    }
  };

  const removeStat = (statName: string) => {
    setEditingStats(prev => {
      const newStats = { ...prev };
      delete newStats[statName];
      return newStats;
    });
  };

  const applySchema = (schemaId: string) => {
    const schema = STAT_SCHEMAS.find(s => s.id === schemaId);
    if (schema) {
      const newStats: StatBlockValue = {};
      schema.stats.forEach(stat => {
        newStats[stat.name] = stat.defaultValue;
      });
      setEditingStats(newStats);
    }
  };

  const renderReadOnlyStats = () => {
    const statEntries = Object.entries(normalizedStats);
    
    if (statEntries.length === 0) {
      return <p className="text-xs text-muted-foreground italic">No stats defined</p>;
    }

    // Handle ProgressBar format display
    if (typeof stats === 'object' && stats.current !== undefined && stats.maximum !== undefined) {
      const percentage = (stats.current / stats.maximum) * 100;
      return (
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>{stats.current}</span>
            <span className="text-muted-foreground">/ {stats.maximum}</span>
          </div>
          <Progress value={percentage} className="h-2" />
        </div>
      );
    }

    // Handle StatBlock format display
    return (
      <div className="grid grid-cols-2 gap-2">
        {statEntries.map(([statName, value]) => {
          const highestValue = Math.max(...Object.values(normalizedStats));
          return (
            <div key={statName} className="flex justify-between text-xs">
              <span className="capitalize text-muted-foreground">{statName}:</span>
              <span className={`font-medium ${
                value === highestValue ? 'font-bold text-primary' : 'text-foreground'
              }`}>
                {value}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderEditingStats = () => {
    const statEntries = Object.entries(editingStats);
    
    return (
      <div className="space-y-4">
        {/* Schema Selection */}
        <div className="space-y-2">
          <Label className="text-xs">Apply Stat Schema</Label>
          <div className="flex gap-2">
            <Select value={selectedSchema} onValueChange={setSelectedSchema}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Choose a preset..." />
              </SelectTrigger>
              <SelectContent>
                {STAT_SCHEMAS.map(schema => (
                  <SelectItem key={schema.id} value={schema.id}>
                    <div className="flex items-center gap-2">
                      <span>{schema.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {schema.genre}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => selectedSchema && applySchema(selectedSchema)}
              disabled={!selectedSchema}
            >
              Apply
            </Button>
          </div>
        </div>

        {/* Existing Stats */}
        {statEntries.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs">Current Stats</Label>
            <div className="space-y-2">
              {statEntries.map(([statName, value]) => (
                <div key={statName} className="flex items-center gap-2">
                  <div className="flex-1">
                    <Label className="text-xs capitalize">{statName}</Label>
                    <Input
                      type="number"
                      value={value}
                      onChange={(e) => updateStatValue(statName, parseInt(e.target.value) || 0)}
                      className="h-8"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeStat(statName)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add New Stat */}
        <div className="space-y-2">
          <Label className="text-xs">Add New Stat</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Stat name"
              value={newStatName}
              onChange={(e) => setNewStatName(e.target.value)}
              className="flex-1 h-8"
            />
            <Input
              type="number"
              placeholder="Value"
              value={newStatValue}
              onChange={(e) => setNewStatValue(parseInt(e.target.value) || 0)}
              className="w-20 h-8"
            />
            <Button
              size="sm"
              onClick={addNewStat}
              disabled={!newStatName.trim() || !!editingStats[newStatName.trim()]}
              className="h-8"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          {newStatName.trim() && editingStats[newStatName.trim()] && (
            <p className="text-xs text-destructive">Stat name already exists</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button size="sm" onClick={saveChanges} className="flex-1">
            <Save className="h-3 w-3 mr-1" />
            Save
          </Button>
          <Button size="sm" variant="outline" onClick={cancelEditing}>
            <RotateCcw className="h-3 w-3 mr-1" />
            Cancel
          </Button>
        </div>
      </div>
    );
  };

  if (!onChange) {
    // Read-only mode
    return (
      <div className="space-y-2">
        <span className="text-sm text-muted-foreground">{label}:</span>
        <div className="pl-2">
          {renderReadOnlyStats()}
        </div>
      </div>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-green-400 flex items-center justify-between">
          {label}
          {!isEditing && (
            <Button size="sm" variant="ghost" onClick={startEditing}>
              Edit
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isEditing ? renderEditingStats() : renderReadOnlyStats()}
      </CardContent>
    </Card>
  );
}
