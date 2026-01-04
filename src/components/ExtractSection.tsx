'use client';

import { MICROSECONDS_PER_MILLISECOND } from '@/constants';
import { useTelemetryExtraction } from '@/hooks/useTelemetryExtraction';
import { saveLap } from '@/lib/db';
import { useI18n } from '@/lib/i18n';
import { downloadFile, formatLapTime, formatTimestamp } from '@/lib/utils';
import type { Lap } from '@/types/types';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Collapse,
  Group,
  Modal,
  NumberInput,
  Paper,
  Progress,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { Download, Flag, Search } from 'lucide-react';
import React, { ChangeEvent, useRef, useState } from 'react';

const ExtractSection: React.FC = () => {
  const { t } = useI18n();
  const {
    loading,
    progress,
    error,
    laps,
    selectedTrackIndex,
    setSelectedTrackIndex,
    detectedTrackName,
    showAdvanced,
    setShowAdvanced,
    processFile,
    getLoadingText,
    tracks,
    pendingAlfanoFile,
    setPendingAlfanoFile,
    processAlfano,
  } = useTelemetryExtraction();

  const [driverName, setDriverName] = useState<string>('');
  const [savingLapId, setSavingLapId] = useState<number | null>(null);
  const [selectedLapNumbers, setSelectedLapNumbers] = useState<number[]>([]);
  const [saveError, setSaveError] = useState<string>('');

  // Alfano Parameters state
  const [pignone, setPignone] = useState<number | ''>(12);
  const [corona, setCorona] = useState<number | ''>(82);
  const [circonferenza, setCirconferenza] = useState<number | ''>(0.84);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const trackNames = tracks.map(t => t.name);

  const handleAlfanoSubmit = async () => {
    if (!selectedTrackId) return;
    const track = tracks.find(t => t.id === selectedTrackId);
    if (!track) return;

    await processAlfano({
      pignone: Number(pignone),
      corona: Number(corona),
      circonferenza: Number(circonferenza),
      track,
    });
  };

  const handleFileSelect = async () => {
    if (window.showOpenFilePicker) {
      try {
        const [fileHandle] = await window.showOpenFilePicker({
          types: [
            {
              description: 'Telemetry Files',
              accept: {
                'video/mp4': ['.mp4'],
                'application/gpx+xml': ['.gpx'],
                'application/geo+json': ['.geojson'],
                'application/csv': ['.csv'],
                'application/zip': ['.zip'],
              },
            },
          ],
        });
        const file = await fileHandle.getFile();
        await processFile(file);
      } catch (err) {
        // AbortError is handled in processFile if needed, or here if it comes from picker
        if (err instanceof DOMException && err.name === 'AbortError') return;
        console.error('File picker error:', err);
      }
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleSaveLap = async (lap: Lap) => {
    try {
      setSavingLapId(lap.lapNumber);
      setSaveError('');
      const sessionTime = lap.data.properties.sessionStartTime / MICROSECONDS_PER_MILLISECOND;
      const trackName =
        detectedTrackName ||
        (selectedTrackIndex !== null ? trackNames[parseInt(selectedTrackIndex)] : t.common.unknown);
      await saveLap(lap, driverName, trackName, sessionTime);
      setSavingLapId(null);
    } catch (err) {
      console.error('Failed to save lap:', err);
      const message = err instanceof Error ? err.message : 'Unknown error saving lap';
      setSaveError(message);
      setSavingLapId(null);
    }
  };

  const handleSaveSelectedLaps = async () => {
    if (!laps) return;
    const lapsToSave = laps.filter((lap) => selectedLapNumbers.includes(lap.lapNumber));
    for (const lap of lapsToSave) {
      await handleSaveLap(lap);
    }
    setSelectedLapNumbers([]);
  };

  const toggleLapSelection = (lapNumber: number) => {
    setSelectedLapNumbers((prev) =>
      prev.includes(lapNumber) ? prev.filter((n) => n !== lapNumber) : [...prev, lapNumber]
    );
  };

  const toggleSelectAll = () => {
    if (!laps) return;
    if (selectedLapNumbers.length === laps.length) {
      setSelectedLapNumbers([]);
    } else {
      setSelectedLapNumbers(laps.map((lap) => lap.lapNumber));
    }
  };

  const handleDownloadLap = (lap: Lap) => {
    downloadFile(lap.data, `telemetry-lap-${lap.lapNumber}.geojson`);
  };

  const currentTrackName =
    detectedTrackName ||
    (selectedTrackIndex !== null ? trackNames[parseInt(selectedTrackIndex)] : null);

  return (
    <Box p="lg" maw={900} w="100%" mx="auto">
      <Stack gap="md">
        <Box>
          <Title order={2}>{t.extract.title}</Title>
          <Text c="dimmed" size="sm">
            {t.extract.subtitle}
          </Text>
        </Box>

        <Group>
          <Button loading={loading} onClick={handleFileSelect}>
            {loading ? getLoadingText() : t.extract.loadFile}
          </Button>
          <UnstyledButton
            onClick={() => setShowAdvanced(!showAdvanced)}
            c="dimmed"
            fz="sm"
            td="underline"
          >
            {showAdvanced ? t.extract.hideSettings : t.extract.advancedSettings}
          </UnstyledButton>
        </Group>

        <Collapse in={showAdvanced}>
          <Paper withBorder p="md" maw={400}>
            <Stack gap="xs">
              <Box>
                <Text fw={600} size="sm">
                  {t.extract.forceTrack}
                </Text>
                <Text c="dimmed" size="sm">
                  {t.extract.overrideAutoDetect}
                </Text>
              </Box>
              <Select
                placeholder={t.extract.autoDetect}
                data={trackNames.map((name, i) => ({ value: i.toString(), label: name }))}
                value={selectedTrackIndex}
                onChange={setSelectedTrackIndex}
                clearable
                size="sm"
              />
            </Stack>
          </Paper>
        </Collapse>

        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".mp4,.gpx,.geojson,.json,.csv,.zip"
          onChange={handleFileChange}
        />

        {loading && <Progress value={progress} size="sm" animated />}

        {error && (
          <Alert color="red" title={t.common.error} variant="light">
            {error}
          </Alert>
        )}

        {saveError && (
          <Alert color="red" title="Save Error" variant="light" withCloseButton onClose={() => setSaveError('')}>
            {saveError}
          </Alert>
        )}

        {!loading &&
          laps !== undefined &&
          (laps.length > 0 ? (
            <Stack gap="sm">
              <Paper withBorder p="md">
                <Group justify="space-between" align="center">
                  <Group gap="xs">
                    <Flag size={20} />
                    <Box>
                      {currentTrackName && (
                        <Text fw={600} size="sm">
                          {currentTrackName}
                        </Text>
                      )}
                      <Text c="dimmed" size="sm">
                        {formatTimestamp(
                          laps[0].data.properties.sessionStartTime / MICROSECONDS_PER_MILLISECOND
                        )}
                      </Text>
                    </Box>
                  </Group>
                  <Group gap="sm">
                    <TextInput
                      placeholder={t.extract.driverName}
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      size="sm"
                      w={140}
                    />
                    <Button
                      size="sm"
                      onClick={handleSaveSelectedLaps}
                      disabled={savingLapId !== null || selectedLapNumbers.length === 0}
                    >
                      {t.extract.saveSelected} ({selectedLapNumbers.length})
                    </Button>
                  </Group>
                </Group>
              </Paper>

              <Paper withBorder p={0}>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th w={40}>
                        <Checkbox
                          checked={selectedLapNumbers.length === laps.length}
                          indeterminate={
                            selectedLapNumbers.length > 0 && selectedLapNumbers.length < laps.length
                          }
                          onChange={toggleSelectAll}
                          size="xs"
                        />
                      </Table.Th>
                      <Table.Th>{t.extract.lap}</Table.Th>
                      <Table.Th>{t.extract.time}</Table.Th>
                      <Table.Th w={60}></Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {laps.map((lap) => (
                      <Table.Tr key={lap.lapNumber}>
                        <Table.Td>
                          <Checkbox
                            checked={selectedLapNumbers.includes(lap.lapNumber)}
                            onChange={() => toggleLapSelection(lap.lapNumber)}
                            size="xs"
                          />
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" c="dimmed">
                            {t.extract.lap} {lap.lapNumber}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" fw={600} ff="monospace">
                            {formatLapTime(lap.lapTime)}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Button
                            size="compact-xs"
                            variant="subtle"
                            onClick={() => handleDownloadLap(lap)}
                          >
                            <Download size={14} />
                          </Button>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>
            </Stack>
          ) : (
            <Paper withBorder ta="center" py="xl">
              <Search size={48} style={{ opacity: 0.5 }} />
              <Text c="dimmed" mt="xs">
                {t.extract.noLapsFound}
              </Text>
            </Paper>
          ))}
      </Stack>

      {/* Alfano Import Modal */}
      <Modal
        opened={!!pendingAlfanoFile}
        onClose={() => setPendingAlfanoFile(null)}
        title={t.extract.alfanoTitle}
        centered
      >
        <Stack>
          <Text size="sm" c="dimmed">
            {t.extract.alfanoSubtitle}
          </Text>
          <Alert color="yellow" title="Disclaimer" variant="light">
            {t.extract.alfanoDisclaimer}
          </Alert>
          <Group grow>
            <NumberInput
              label={t.extract.pignone}
              value={pignone}
              onChange={(val) => setPignone(val as number | '')}
              min={1}
            />
            <NumberInput
              label={t.extract.corona}
              value={corona}
              onChange={(val) => setCorona(val as number | '')}
              min={1}
            />
          </Group>
          <NumberInput
            label={t.extract.wheelCircumference}
            value={circonferenza}
            onChange={(val) => setCirconferenza(val as number | '')}
            min={0}
            step={0.01}
            decimalScale={3}
          />
          <Select
            label={t.extract.selectTrack}
            placeholder={t.analyze.selectPlaceholder}
            data={tracks.map((t) => ({ value: t.id, label: `${t.name} (${t.length}m)` }))}
            value={selectedTrackId}
            onChange={setSelectedTrackId}
            required
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setPendingAlfanoFile(null)}>
              {t.common.cancel}
            </Button>
            <Button onClick={handleAlfanoSubmit} disabled={!selectedTrackId}>
              {t.common.confirm}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
};

export default ExtractSection;

