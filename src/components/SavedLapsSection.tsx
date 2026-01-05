'use client';

import { useLaps } from '@/hooks/useLaps';
import { deleteLap, updateLapDriver } from '@/lib/db';
import { interpolate, useI18n } from '@/lib/i18n';
import { downloadFile, formatLapTime, formatShortDate } from '@/lib/utils';
import type { SavedLap } from '@/types/types';
import {
    ActionIcon,
    Box,
    Button,
    Group,
    Modal,
    Paper,
    Skeleton,
    Stack,
    Table,
    Text,
    TextInput,
    Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Check, Download, FolderOpen, Pencil, Trash2, X } from 'lucide-react';
import React, { useState } from 'react';

const SavedLapsSection: React.FC = () => {
  const { t } = useI18n();
  const { laps, loading, refetch } = useLaps();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] =
    useDisclosure(false);
  const [lapToDelete, setLapToDelete] = useState<string | null>(null);

  const handleConfirmDelete = (id: string) => {
    setLapToDelete(id);
    openDeleteModal();
  };

  const handleDelete = async () => {
    if (lapToDelete) {
      await deleteLap(lapToDelete);
      setLapToDelete(null);
      closeDeleteModal();
      refetch();
    }
  };

  const handleStartEdit = (lap: SavedLap) => {
    setEditingId(lap.id);
    setEditName(lap.driverName);
  };

  const handleSaveEdit = async (id: string) => {
    await updateLapDriver(id, editName);
    setEditingId(null);
    refetch();
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleDownloadLap = (lap: SavedLap) => {
    const filename = `${lap.driverName || 'driver'}-lap-${lap.lapNumber}.geojson`;
    downloadFile(lap.data, filename);
  };

  const getLapsCountText = () => {
    if (laps.length === 1) {
      return interpolate(t.saved.lapsCount, { count: 1 });
    }
    return interpolate(t.saved.lapsCountPlural, { count: laps.length });
  };

  if (loading) {
    return (
      <Box p={{ base: 'md', sm: 'lg' }} maw={900} w="100%" mx="auto" style={{ overflowX: 'hidden' }}>
        <Stack gap="md">
          <Box>
            <Skeleton height={32} width={150} mb="xs" />
            <Skeleton height={16} width={100} />
          </Box>
          <Paper withBorder p={0}>
             <Table striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t.saved.driver}</Table.Th>
                  <Table.Th>{t.saved.track}</Table.Th>
                  <Table.Th>{t.extract.lap}</Table.Th>
                  <Table.Th>{t.extract.time}</Table.Th>
                  <Table.Th>{t.saved.session}</Table.Th>
                  <Table.Th w={100}></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {[1, 2, 3].map((i) => (
                  <Table.Tr key={i}>
                    <Table.Td><Skeleton height={16} width={80} /></Table.Td>
                    <Table.Td><Skeleton height={16} width={100} /></Table.Td>
                    <Table.Td><Skeleton height={16} width={30} /></Table.Td>
                    <Table.Td><Skeleton height={16} width={60} /></Table.Td>
                    <Table.Td><Skeleton height={16} width={90} /></Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                         <Skeleton height={22} width={22} radius="md" />
                         <Skeleton height={22} width={22} radius="md" />
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
        </Stack>
      </Box>
    );
  }

  return (
    <Box p={{ base: 'md', sm: 'lg' }} maw={900} w="100%" mx="auto" style={{ overflowX: 'hidden' }}>
      <Stack gap="md">
        <Box>
          <Title order={2}>{t.saved.title}</Title>
          <Text c="dimmed" size="sm">
            {getLapsCountText()}
          </Text>
        </Box>

        {laps.length === 0 ? (
          <Paper withBorder ta="center" py="xl">
            <FolderOpen size={48} style={{ opacity: 0.5 }} />
            <Text fw={600} mt="xs">
              {t.saved.noSavedLaps}
            </Text>
            <Text c="dimmed" size="sm">
              {t.saved.goToExtract}
            </Text>
          </Paper>
        ) : (
          <Paper withBorder p={0} style={{ overflow: 'hidden' }}>
            <Table.ScrollContainer minWidth={500}>
              <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t.saved.driver}</Table.Th>
                  <Table.Th>{t.saved.track}</Table.Th>
                  <Table.Th>{t.extract.lap}</Table.Th>
                  <Table.Th>{t.extract.time}</Table.Th>
                  <Table.Th>{t.saved.session}</Table.Th>
                  <Table.Th w={100}></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {laps.map((lap) => (
                  <Table.Tr key={lap.id}>
                    <Table.Td>
                      {editingId === lap.id ? (
                        <Group gap={4}>
                          <TextInput
                            size="xs"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder={t.saved.namePlaceholder}
                            w={100}
                            autoFocus
                          />
                          <ActionIcon size="sm" color="blue" onClick={() => handleSaveEdit(lap.id)}>
                            <Check size={14} />
                          </ActionIcon>
                          <ActionIcon size="sm" color="gray" onClick={handleCancelEdit}>
                            <X size={14} />
                          </ActionIcon>
                        </Group>
                      ) : (
                        <Group gap={4}>
                          <Text size="sm">{lap.driverName || '—'}</Text>
                          <ActionIcon
                            size="xs"
                            variant="subtle"
                            onClick={() => handleStartEdit(lap)}
                          >
                            <Pencil size={12} />
                          </ActionIcon>
                        </Group>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="blue.4">
                        {lap.trackName}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {lap.lapNumber}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" fw={600} ff="monospace">
                        {formatLapTime(lap.lapTime)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {formatShortDate(lap.sessionTime)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <Button
                          size="compact-xs"
                          variant="subtle"
                          color="blue"
                          onClick={() => handleDownloadLap(lap)}
                        >
                          <Download size={14} />
                        </Button>
                        <Button
                          size="compact-xs"
                          variant="subtle"
                          onClick={() => handleConfirmDelete(lap.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Paper>
        )}
      </Stack>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title={t.common.delete}
        centered
        size="sm"
      >
        <Stack>
          <Text>{t.saved.confirmDelete}</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={closeDeleteModal}>
              {t.common.cancel}
            </Button>
            <Button onClick={handleDelete}>
              {t.common.delete}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
};

export default SavedLapsSection;
