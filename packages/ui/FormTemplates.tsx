/**
 * Form Templates Component
 * Provides quick presets for common request/trip types
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export interface RequestTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  values: {
    title?: string;
    description?: string;
    length?: string;
    width?: string;
    height?: string;
    weight?: string;
    preferredMethod?: 'plane' | 'boat' | 'any';
    restrictedItems?: boolean;
  };
}

export interface TripTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  values: {
    tripType?: 'plane' | 'boat';
    spareKg?: string;
    spareVolume?: string;
    maxLength?: string;
    maxWidth?: string;
    maxHeight?: string;
  };
}

export const REQUEST_TEMPLATES: RequestTemplate[] = [
  {
    id: 'small-package',
    name: 'Small Package',
    description: '10×10×10cm, ~1kg',
    icon: 'inbox',
    values: {
      length: '10',
      width: '10',
      height: '10',
      weight: '1',
      preferredMethod: 'any',
    },
  },
  {
    id: 'medium-box',
    name: 'Medium Box',
    description: '30×20×15cm, ~5kg',
    icon: 'package',
    values: {
      length: '30',
      width: '20',
      height: '15',
      weight: '5',
      preferredMethod: 'any',
    },
  },
  {
    id: 'large-item',
    name: 'Large Item',
    description: '50×40×30cm, ~15kg',
    icon: 'archive',
    values: {
      length: '50',
      width: '40',
      height: '30',
      weight: '15',
      preferredMethod: 'boat',
    },
  },
  {
    id: 'boat-parts',
    name: 'Boat Parts',
    description: 'Common marine equipment',
    icon: 'build',
    values: {
      title: 'Boat parts',
      description: 'Marine equipment and boat parts',
      length: '40',
      width: '30',
      height: '25',
      weight: '10',
      preferredMethod: 'boat',
      restrictedItems: true,
    },
  },
  {
    id: 'electronics',
    name: 'Electronics',
    description: 'Small electronics, batteries',
    icon: 'devices',
    values: {
      title: 'Electronics',
      length: '25',
      width: '20',
      height: '15',
      weight: '3',
      preferredMethod: 'plane',
      restrictedItems: false,
    },
  },
];

export const TRIP_TEMPLATES: TripTemplate[] = [
  {
    id: 'plane-carry-on',
    name: 'Plane Carry-On',
    description: 'Standard carry-on capacity',
    icon: 'flight',
    values: {
      tripType: 'plane',
      spareKg: '10',
      spareVolume: '30',
      maxLength: '55',
      maxWidth: '40',
      maxHeight: '23',
    },
  },
  {
    id: 'plane-checked',
    name: 'Plane Checked Bag',
    description: 'Checked luggage capacity',
    icon: 'luggage',
    values: {
      tripType: 'plane',
      spareKg: '23',
      spareVolume: '70',
      maxLength: '62',
      maxWidth: '50',
      maxHeight: '30',
    },
  },
  {
    id: 'boat-small',
    name: 'Boat - Small Items',
    description: 'Small items on boat trip',
    icon: 'directions-boat',
    values: {
      tripType: 'boat',
      spareKg: '20',
      spareVolume: '100',
      maxLength: '100',
      maxWidth: '80',
      maxHeight: '60',
    },
  },
  {
    id: 'boat-large',
    name: 'Boat - Large Items',
    description: 'Oversized items, outboards, spars',
    icon: 'sailing',
    values: {
      tripType: 'boat',
      spareKg: '50',
      spareVolume: '200',
      maxLength: '300',
      maxWidth: '150',
      maxHeight: '100',
    },
  },
];

interface FormTemplatesProps {
  visible: boolean;
  onClose: () => void;
  onSelectTemplate: (template: RequestTemplate | TripTemplate) => void;
  type: 'request' | 'trip';
}

export function FormTemplates({
  visible,
  onClose,
  onSelectTemplate,
  type,
}: FormTemplatesProps) {
  const templates = type === 'request' ? REQUEST_TEMPLATES : TRIP_TEMPLATES;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose Template</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.templatesList}>
            {templates.map((template) => (
              <TouchableOpacity
                key={template.id}
                style={styles.templateCard}
                onPress={() => {
                  onSelectTemplate(template);
                  onClose();
                }}
              >
                <View style={styles.templateIcon}>
                  <MaterialIcons name={template.icon as any} size={32} color="#14b8a6" />
                </View>
                <View style={styles.templateInfo}>
                  <Text style={styles.templateName}>{template.name}</Text>
                  <Text style={styles.templateDescription}>{template.description}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#999" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  templatesList: {
    padding: 16,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  templateIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e0f7fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 14,
    color: '#666',
  },
});

