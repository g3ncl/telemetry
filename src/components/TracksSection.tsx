'use client';

import { useTracks } from '@/hooks/useTracks';
import { useI18n } from '@/lib/i18n';
import type { SavedTrack } from '@/types/types';
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Modal,
  NumberInput,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { Map, Pencil, Plus, Trash2 } from 'lucide-react';
import React, { useState } from 'react';

const TracksSection: React.FC = () => {
  const { t } = useI18n();
  const { tracks, loading, addOrUpdateTrack, removeTrack } = useTracks();
  const [opened, { open, close }] = useDisclosure(false);
  const [editingTrack, setEditingTrack] = useState<SavedTrack | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [length, setLength] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  const handleOpenModal = (track?: SavedTrack) => {
    if (track) {
      setEditingTrack(track);
      setName(track.name);
      setLength(track.length);
      setNotes(track.notes || '');
    } else {
      setEditingTrack(null);
      setName('');
      setLength('');
      setNotes('');
    }
    open();
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      notifications.show({
        title: t.common.error,
        message: t.tracks.nameRequired,
        color: 'red',
      });
      return;
    }
    if (!length || length <= 0) {
      notifications.show({
        title: t.common.error,
        message: t.tracks.lengthRequired,
        color: 'red',
      });
      return;
    }

    try {
      await addOrUpdateTrack({
        id: editingTrack?.id,
        name,
        length: Number(length),
        notes,
      });

      notifications.show({
        title: t.common.success,
        message: editingTrack ? t.tracks.updateSuccess : t.tracks.createSuccess,
        color: 'green',
      });
      close();
    } catch (error) {
        console.error(error);
      notifications.show({
        title: t.common.error,
        message: t.common.error, // Generic error for now
        color: 'red',
      });
    }
  };

  const handleDelete = async (id: string, name: string) => {
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

  if (loading) {
    return (
      <Box p={{ base: 'md', sm: 'lg' }} maw={1200} w="100%" mx="auto">
        <Stack gap="md">
          <Box>
            <Skeleton height={32} width={200} mb="xs" />
            <Skeleton height={16} width={300} />
          </Box>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} height={150} radius="md" />
            ))}
          </SimpleGrid>
        </Stack>
      </Box>
    );
  }

  return (
    <Box p={{ base: 'md', sm: 'lg' }} maw={1200} w="100%" mx="auto">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between" align="center">
          <Box>
            <Title order={2}>{t.tracks.title}</Title>
            <Text c="dimmed" size="sm">
              {t.tracks.subtitle}
            </Text>
          </Box>
          <Button leftSection={<Plus size={16} />} onClick={() => handleOpenModal()}>
            {t.tracks.addTrack}
          </Button>
        </Group>

        {/* Tracks Grid */}
        {tracks.length === 0 ? (
          <Card withBorder padding="xl" radius="md" ta="center">
            <Stack align="center" gap="md">
              <Map size={48} style={{ opacity: 0.3 }} />
              <Text fw={500}>{t.tracks.noTracks}</Text>
              <Button variant="light" onClick={() => handleOpenModal()}>
                {t.tracks.addTrack}
              </Button>
            </Stack>
          </Card>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
            {tracks.map((track) => (
              <Card key={track.id} shadow="sm" padding="lg" radius="md" withBorder>
                <Stack justify="space-between" h="100%">
                  <Box>
                    <Group justify="space-between" mb="xs">
                      <Text fw={600} size="lg" lineClamp={1}>
                        {track.name}
                      </Text>
                      <Badge variant="light" color="blue">
                        {track.length} m
                      </Badge>
                    </Group>
                    {track.isSystem && (
                      <Badge variant="dot" color="gray" size="xs" mb="xs">
                        System
                      </Badge>
                    )}
                    {track.notes && (
                      <Text size="sm" c="dimmed" lineClamp={3}>
                        {track.notes}
                      </Text>
                    )}
                  </Box>

                  <Group mt="md" justify="flex-end" gap="xs">
                    <ActionIcon
                      variant="subtle"
                      color="blue"
                      onClick={() => handleOpenModal(track)}
                      aria-label={t.tracks.editTrack}
                      disabled={track.isSystem}
                    >
                      <Pencil size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() => handleDelete(track.id, track.name)}
                      aria-label={t.tracks.deleteTrack}
                      disabled={track.isSystem}
                    >
                      <Trash2 size={16} />
                    </ActionIcon>
                  </Group>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </Stack>

      {/* Add/Edit Modal */}
      <Modal
        opened={opened}
        onClose={close}
        title={editingTrack ? t.tracks.editTrack : t.tracks.addTrack}
        centered
      >
        <Stack>
          <TextInput
            label={t.tracks.name}
            placeholder="South Garda Karting"
            required
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
          />
          <NumberInput
            label={t.tracks.length}
            placeholder="1200"
            required
            value={length}
            onChange={(val) => setLength(val as number | '')}
            min={0}
            suffix=" m"
          />
          
          <SimpleGrid cols={2}>
             <TextInput
               label="Finish Line Start (Lon, Lat)"
               placeholder="15.123, 40.123"
               value={editingTrack?.fLStart ? `${editingTrack.fLStart[0]}, ${editingTrack.fLStart[1]}` : ''}
               disabled
               description="Managed via GPS extraction or System defaults"
             />
              <TextInput
               label="Finish Line End (Lon, Lat)"
               placeholder="15.123, 40.123"
               value={editingTrack?.fLEnd ? `${editingTrack.fLEnd[0]}, ${editingTrack.fLEnd[1]}` : ''}
               disabled
               description="Managed via GPS extraction or System defaults"
             />
          </SimpleGrid>

          <Textarea
            label={t.tracks.notes}
            placeholder="..."
            value={notes}
            onChange={(event) => setNotes(event.currentTarget.value)}
            minRows={3}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={close}>
              {t.common.cancel}
            </Button>
            <Button onClick={handleSubmit}>{t.common.save}</Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
};

export default TracksSection;
