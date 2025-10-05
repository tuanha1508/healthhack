"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import {
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Clock,
  Type
} from 'lucide-react';

export interface Subtitle {
  id?: string;
  start: number;
  end: number;
  text: string;
}

interface SubtitleEditorProps {
  subtitles: Subtitle[];
  onSubtitlesChange: (subtitles: Subtitle[]) => void;
  videoDuration?: number;
}

export default function SubtitleEditor({
  subtitles,
  onSubtitlesChange,
  videoDuration = 0
}: SubtitleEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedSubtitle, setEditedSubtitle] = useState<Subtitle | null>(null);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const parseTime = (timeStr: string): number => {
    const parts = timeStr.split(':');
    if (parts.length === 2) {
      const [mins, secMs] = parts;
      const [secs, ms = '0'] = secMs.split('.');
      return parseInt(mins) * 60 + parseInt(secs) + parseInt(ms) / 100;
    }
    return 0;
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditedSubtitle({ ...subtitles[index] });
  };

  const handleSave = () => {
    if (editingIndex !== null && editedSubtitle) {
      const newSubtitles = [...subtitles];
      newSubtitles[editingIndex] = editedSubtitle;
      onSubtitlesChange(newSubtitles);
      setEditingIndex(null);
      setEditedSubtitle(null);
    }
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setEditedSubtitle(null);
  };

  const handleDelete = (index: number) => {
    const newSubtitles = subtitles.filter((_, i) => i !== index);
    onSubtitlesChange(newSubtitles);
  };

  const handleAdd = () => {
    const lastSubtitle = subtitles[subtitles.length - 1];
    const newStart = lastSubtitle ? lastSubtitle.end : 0;
    const newSubtitle: Subtitle = {
      start: newStart,
      end: Math.min(newStart + 3, videoDuration),
      text: 'New subtitle'
    };
    onSubtitlesChange([...subtitles, newSubtitle]);
    handleEdit(subtitles.length);
  };

  const exportSRT = () => {
    let srtContent = '';
    subtitles.forEach((subtitle, index) => {
      const startTime = formatTimeSRT(subtitle.start);
      const endTime = formatTimeSRT(subtitle.end);
      srtContent += `${index + 1}\n${startTime} --> ${endTime}\n${subtitle.text}\n\n`;
    });

    const blob = new Blob([srtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subtitles.srt';
    a.click();
  };

  const formatTimeSRT = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${hours.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms
      .toString()
      .padStart(3, '0')}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Type className="h-4 w-4" />
          Subtitles Editor
        </h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={exportSRT}>
            Export SRT
          </Button>
          <Button size="sm" onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-1" />
            Add Subtitle
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[300px] border rounded-lg">
        <div className="p-4 space-y-2">
          {subtitles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Type className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No subtitles yet</p>
              <p className="text-xs mt-1">Transcription will appear here after recording</p>
            </div>
          ) : (
            subtitles.map((subtitle, index) => (
              <Card key={index} className="p-3">
                {editingIndex === index && editedSubtitle ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground">Start</label>
                        <Input
                          value={formatTime(editedSubtitle.start)}
                          onChange={(e) => {
                            const time = parseTime(e.target.value);
                            setEditedSubtitle({ ...editedSubtitle, start: time });
                          }}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">End</label>
                        <Input
                          value={formatTime(editedSubtitle.end)}
                          onChange={(e) => {
                            const time = parseTime(e.target.value);
                            setEditedSubtitle({ ...editedSubtitle, end: time });
                          }}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                    <textarea
                      value={editedSubtitle.text}
                      onChange={(e) =>
                        setEditedSubtitle({ ...editedSubtitle, text: e.target.value })
                      }
                      className="w-full p-2 border rounded text-sm"
                      rows={2}
                    />
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={handleCancel}>
                        <X className="h-3 w-3" />
                      </Button>
                      <Button size="sm" onClick={handleSave}>
                        <Save className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatTime(subtitle.start)} - {formatTime(subtitle.end)}</span>
                      </div>
                      <p className="text-sm">{subtitle.text}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(index)}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      {subtitles.length > 0 && (
        <div className="text-xs text-muted-foreground">
          {subtitles.length} subtitle{subtitles.length !== 1 ? 's' : ''} •
          Total duration: {formatTime(videoDuration)}
        </div>
      )}
    </div>
  );
}