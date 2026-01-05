import { DEFAULT_CHART_COLORS, SUPPORTED_LOCALES } from '@/constants';
import { useTracks } from '@/hooks/useTracks';
import { clearAllLaps, getAllLaps, importLaps } from '@/lib/db';
import { localeNames, useI18n, type Locale } from '@/lib/i18n';
import { downloadFile } from '@/lib/utils';
import type { SavedLap, SavedTrack } from '@/types/types';
import {
    ActionIcon,
    Badge,
    Box,
    Button,
    Card,
    ColorInput,
    Divider,
    Group,
    Modal,
    NumberInput,
    Paper,
    Select,
    SimpleGrid,
    Skeleton,
    Stack,
    Text,
    Textarea,
    TextInput,
    Title,
    useMantineColorScheme
} from '@mantine/core';
import { useDisclosure, useLocalStorage } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { ArrowDownToLine, ArrowUpFromLine, Pencil, Plus, Trash2 } from 'lucide-react';
import React, { useRef, useState } from 'react';

interface ImportData {
  version?: number;
  laps?: SavedLap[];
  settings?: {
    chartColors?: { driver1: string; driver2: string };
    colorScheme?: string;
    locale?: string;
  };
}

const SettingsSection: React.FC = () => {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const { locale, setLocale, t } = useI18n();
  
  // Tracks State
  const { tracks, loading: tracksLoading, addOrUpdateTrack, removeTrack } = useTracks();
  const [trackModalOpened, { open: openTrackModal, close: closeTrackModal }] = useDisclosure(false);
  const [editingTrack, setEditingTrack] = useState<SavedTrack | null>(null);
  
  // Track Form State
  const [trackName, setTrackName] = useState('');
  const [trackLength, setTrackLength] = useState<number | ''>('');
  const [trackNotes, setTrackNotes] = useState('');
  const [trackFLStart, setTrackFLStart] = useState('');
  const [trackFLEnd, setTrackFLEnd] = useState('');

  // Settings State
  const [clearing, setClearing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [confirmModalOpened, { open: openConfirmModal, close: closeConfirmModal }] =
    useDisclosure(false);
  const [importModalOpened, { open: openImportModal, close: closeImportModal }] =
    useDisclosure(false);
  const [importData, setImportData] = useState<ImportData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [chartColors, setChartColors] = useLocalStorage({
    key: 'telemetry-chart-colors',
    defaultValue: DEFAULT_CHART_COLORS,
  });

  // Track Handlers
  const handleOpenTrackModal = (track?: SavedTrack) => {
    if (track) {
      setEditingTrack(track);
      setTrackName(track.name);
      setTrackLength(track.length);
      setTrackNotes(track.notes || '');
      setTrackFLStart(track.fLStart ? `${track.fLStart[0]}, ${track.fLStart[1]}` : '');
      setTrackFLEnd(track.fLEnd ? `${track.fLEnd[0]}, ${track.fLEnd[1]}` : '');
    } else {
      setEditingTrack(null);
      setTrackName('');
      setTrackLength('');
      setTrackNotes('');
      setTrackFLStart('');
      setTrackFLEnd('');
    }
    openTrackModal();
  };

  const handleTrackSubmit = async () => {
    if (!trackName.trim()) {
      notifications.show({
        title: t.common.error,
        message: t.tracks.nameRequired,
        color: 'red',
      });
      return;
    }
    if (!trackLength || trackLength <= 0) {
      notifications.show({
        title: t.common.error,
        message: t.tracks.lengthRequired,
        color: 'red',
      });
      return;
    }
    
    const parseCoords = (input: string): [number, number] | undefined => {
        const parts = input.split(',').map(s => parseFloat(s.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            return [parts[0], parts[1]];
        }
        return undefined;
    };

    try {
      await addOrUpdateTrack({
        id: editingTrack?.id,
        name: trackName,
        length: Number(trackLength),
        notes: trackNotes,
        fLStart: parseCoords(trackFLStart),
        fLEnd: parseCoords(trackFLEnd),
      });

      notifications.show({
        title: t.common.success,
        message: editingTrack ? t.tracks.updateSuccess : t.tracks.createSuccess,
        color: 'green',
      });
      closeTrackModal();
    } catch (error) {
        console.error(error);
      notifications.show({
        title: t.common.error,
        message: t.common.error,
        color: 'red',
      });
    }
  };

  const handleTrackDelete = async (id: string, name: string) => {
    if (window.confirm(t.tracks.confirmDelete)) {
      try {
        await removeTrack(id);
        notifications.show({
          title: t.common.success,
          message: t.tracks.deleteSuccess,
          color: 'green',
        });
      } catch (error) {
        console.error(error);
        notifications.show({
          title: t.common.error,
          message: t.common.error,
          color: 'red',
        });
      }
    }
  };


  const handleClearData = async () => {
    setClearing(true);
    try {
      await clearAllLaps();
      notifications.show({
        title: t.common.success,
        message: t.settings.dataCleared,
        color: 'green',
      });
      closeConfirmModal();
    } catch (err) {
      console.error(err);
      notifications.show({
        title: t.common.error,
        message: t.settings.clearFailed,
        color: 'red',
      });
    }
    setClearing(false);
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const laps = await getAllLaps();
      const settings = {
        chartColors: JSON.parse(localStorage.getItem('telemetry-chart-colors') || 'null'),
        colorScheme: localStorage.getItem('mantine-color-scheme-value'),
        locale: localStorage.getItem('telemetry-locale'),
      };
      
      const exportData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        laps,
        settings,
      };

      const dateStr = new Date().toISOString().split('T')[0];
      downloadFile(exportData, `kart-telemetry-backup-${dateStr}.json`);
      notifications.show({
        title: t.common.success,
        message: t.settings.exportSuccess,
        color: 'green',
      });
    } catch (err) {
      console.error('Export failed:', err);
      notifications.show({
        title: t.common.error,
        message: 'Failed to export data',
        color: 'red',
      });
    }
    setExporting(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setImportData(json);
        openImportModal();
      } catch (err) {
        console.error('Invalid JSON:', err);
        notifications.show({
          title: t.common.error,
          message: t.settings.importError,
          color: 'red',
        });
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleImportData = async () => {
    if (!importData) return;
    
    closeImportModal();
    setImporting(true);
    try {
      // 1. Clear existing laps
      await clearAllLaps();

      // 2. Import laps if present
      if (importData.laps && Array.isArray(importData.laps)) {
        await importLaps(importData.laps);
      }

      // 3. Restore settings
      if (importData.settings) {
        if (importData.settings.chartColors) {
          localStorage.setItem('telemetry-chart-colors', JSON.stringify(importData.settings.chartColors));
        }
        if (importData.settings.colorScheme) {
          localStorage.setItem('mantine-color-scheme-value', importData.settings.colorScheme);
        }
        if (importData.settings.locale) {
          localStorage.setItem('telemetry-locale', importData.settings.locale);
        }
      }

      notifications.show({
        title: t.common.success,
        message: t.settings.importSuccess,
        color: 'green',
      });
      
      // Short delay to show success before reload
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error('Import failed:', err);
      notifications.show({
        title: t.common.error,
        message: t.settings.importError,
        color: 'red',
      });
      setImporting(false);
    }
  };

  const languageOptions = SUPPORTED_LOCALES.map((loc) => ({
    value: loc,
    label: localeNames[loc],
  }));

  const themeOptions = [
    { value: 'dark', label: t.settings.themeDark },
    { value: 'light', label: t.settings.themeLight },
  ];

  return (
    <Box p="lg" maw={900} w="100%" mx="auto">
      <Stack gap="md">
        <Box>
          <Title order={2}>{t.settings.title}</Title>
          <Text c="dimmed" size="sm">
            {t.settings.subtitle}
          </Text>
        </Box>

        <Paper withBorder p="md">
          <Stack gap="md">
            {/* Theme Setting */}
            <Group justify="space-between" align="center">
              <Box>
                <Text fw={600} size="sm">
                  {t.settings.theme}
                </Text>
                <Text c="dimmed" size="sm">
                  {t.settings.themeDescription}
                </Text>
              </Box>
              <Select
                value={colorScheme}
                onChange={(value) => value && setColorScheme(value as 'dark' | 'light')}
                data={themeOptions}
                w={120}
                size="sm"
              />
            </Group>

            <Divider />

            {/* Language Setting */}
            <Group justify="space-between" align="center">
              <Box>
                <Text fw={600} size="sm">
                  {t.settings.language}
                </Text>
                <Text c="dimmed" size="sm">
                  {t.settings.languageDescription}
                </Text>
              </Box>
              <Select
                value={locale}
                onChange={(value) => value && setLocale(value as Locale)}
                data={languageOptions}
                w={120}
                size="sm"
              />
            </Group>

            <Divider />

            {/* Chart Colors Setting */}
            <Group justify="space-between" align="flex-start">
              <Box>
                <Text fw={600} size="sm">
                  {t.settings.chartColors}
                </Text>
                <Text c="dimmed" size="sm">
                  {t.settings.chartColorsDescription}
                </Text>
              </Box>
              <Stack gap="xs">
                <Group>
                  <Text size="sm" w={80}>
                    {t.settings.color1}
                  </Text>
                  <ColorInput
                    value={chartColors.driver1}
                    onChange={(val) => setChartColors({ ...chartColors, driver1: val })}
                    size="sm"
                    w={120}
                  />
                </Group>
                <Group>
                  <Text size="sm" w={80}>
                    {t.settings.color2}
                  </Text>
                  <ColorInput
                    value={chartColors.driver2}
                    onChange={(val) => setChartColors({ ...chartColors, driver2: val })}
                    size="sm"
                    w={120}
                  />
                </Group>
              </Stack>
            </Group>

            <Divider />
            
            {/* Track Management */}
             <Group justify="space-between" align="center" mb="xs">
               <Box>
                  <Text fw={600} size="sm">
                    {t.tracks.title}
                  </Text>
                  <Text c="dimmed" size="sm">
                     {t.tracks.subtitle}
                  </Text>
               </Box>
               <Button variant="light" size='xs' leftSection={<Plus size={14} />} onClick={() => handleOpenTrackModal()}>
                  {t.tracks.addTrack}
               </Button>
            </Group>
            
            {tracksLoading ? (
                 <SimpleGrid cols={1} spacing="xs">
                    <Skeleton height={60} radius="md" maw={600} />
                    <Skeleton height={60} radius="md" maw={600} />
                 </SimpleGrid>
            ) : tracks.length === 0 ? (
                 <Text c="dimmed" size="sm" fs="italic" ta="center" py="sm">{t.tracks.noTracks}</Text>
            ) : (
                <SimpleGrid cols={1} spacing="xs">
                    {tracks.map((track) => (
                      <Card key={track.id} shadow="none" withBorder padding="xs" radius="md" maw={600}>
                        <Group justify="space-between" wrap="nowrap" align="center">
                            <Box style={{ flex: 1, minWidth: 0 }}>
                                <Group gap="xs" wrap="nowrap" mb={2}>
                                    <Text fw={600} size="sm" lineClamp={1} title={track.name}>
                                        {track.name}
                                    </Text>
                                    {track.isSystem && (
                                    <Badge variant="dot" color="gray" size="xs">
                                        System
                                    </Badge>
                                    )}
                                </Group>
                                <Text size="xs" c="dimmed" lineClamp={1}>
                                    {track.length}m {track.notes ? `• ${track.notes}` : ''}
                                </Text>
                            </Box>
                            <Group gap={4} wrap="nowrap">
                                <ActionIcon
                                    variant="subtle"
                                    color="blue"
                                    size="sm"
                                    onClick={() => handleOpenTrackModal(track)}
                                    disabled={track.isSystem}
                                >
                                <Pencil size={14} />
                                </ActionIcon>
                                <ActionIcon
                                    variant="subtle"
                                    color="red"
                                    size="sm"
                                    onClick={() => handleTrackDelete(track.id, track.name)}
                                    disabled={track.isSystem}
                                >
                                <Trash2 size={14} />
                                </ActionIcon>
                            </Group>
                        </Group>
                      </Card>
                    ))}
                </SimpleGrid>
            )}

            <Divider />

            {/* Data Management */}
            <Group justify="space-between" align="center">
              <Box>
                <Text fw={600} size="sm">
                  {t.settings.dataManagement}
                </Text>
                <Text c="dimmed" size="sm">
                  {t.settings.dataManagementDescription}
                </Text>
              </Box>
              <Group>
                <Button
                  variant="default"
                  size="sm"
                  leftSection={<ArrowDownToLine size={16} />}
                  onClick={handleExportData}
                  loading={exporting}
                  disabled={importing || clearing}
                >
                  {t.settings.export}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  leftSection={<ArrowUpFromLine size={16} />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={exporting || clearing}
                >
                  {t.settings.import}
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept=".json"
                  onChange={handleFileSelect}
                />
              </Group>
            </Group>

            <Divider />

            {/* Clear Data Setting */}
            <Group justify="space-between" align="center">
              <Box>
                <Text fw={600} size="sm">
                  {t.settings.clearData}
                </Text>
                <Text c="dimmed" size="sm">
                  {t.settings.clearDataDescription}
                </Text>
              </Box>
              <Button
                variant="filled"
                size="sm"
                leftSection={<Trash2 size={14} />}
                onClick={openConfirmModal}
                disabled={exporting || importing}
              >
                {t.settings.clearButton}
              </Button>
            </Group>
          </Stack>
        </Paper>
      </Stack>

      {/* Clear Confirmation Modal */}
      <Modal
        opened={confirmModalOpened}
        onClose={closeConfirmModal}
        title={t.settings.clearData}
        centered
        closeOnClickOutside={!clearing}
        closeOnEscape={!clearing}
        withCloseButton={!clearing}
      >
        <Stack>
          <Text>{t.settings.confirmClear}</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={closeConfirmModal} disabled={clearing}>
              {t.common.cancel}
            </Button>
            <Button onClick={handleClearData} loading={clearing}>
              {t.common.delete}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Import Confirmation Modal */}
      <Modal
        opened={importModalOpened}
        onClose={closeImportModal}
        title={t.settings.importConfirmTitle}
        centered
        closeOnClickOutside={!importing}
        closeOnEscape={!importing}
        withCloseButton={!importing}
      >
        <Stack>
          <Text>{t.settings.importConfirmBody}</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={closeImportModal} disabled={importing}>
              {t.common.cancel}
            </Button>
            <Button color="red" onClick={handleImportData} loading={importing}>
              {t.common.confirm}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Add/Edit Track Modal */}
      <Modal
        opened={trackModalOpened}
        onClose={closeTrackModal}
        title={editingTrack ? t.tracks.editTrack : t.tracks.addTrack}
        centered
      >
        <Stack>
          <TextInput
            label={t.tracks.name}
            placeholder="South Garda Karting"
            required
            value={trackName}
            onChange={(event) => setTrackName(event.currentTarget.value)}
          />
          <NumberInput
            label={t.tracks.length}
            placeholder="1200"
            required
            value={trackLength}
            onChange={(val) => setTrackLength(val as number | '')}
            min={0}
            suffix=" m"
          />
           <SimpleGrid cols={2}>
             <TextInput
               label="Finish Line Start (Lon, Lat)"
               placeholder="15.123, 40.123"
               value={trackFLStart}
               onChange={(event) => setTrackFLStart(event.currentTarget.value)}
             />
              <TextInput
               label="Finish Line End (Lon, Lat)"
               placeholder="15.123, 40.123"
               value={trackFLEnd}
               onChange={(event) => setTrackFLEnd(event.currentTarget.value)}
             />
          </SimpleGrid>
          <Textarea
            label={t.tracks.notes}
            placeholder="..."
            value={trackNotes}
            onChange={(event) => setTrackNotes(event.currentTarget.value)}
            minRows={3}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={closeTrackModal}>
              {t.common.cancel}
            </Button>
            <Button onClick={handleTrackSubmit}>{t.common.save}</Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
};

export default SettingsSection;
