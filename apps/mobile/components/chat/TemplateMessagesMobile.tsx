/**
 * Template Messages - Mobile
 * Quick message templates for common responses
 */

import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

interface TemplateMessagesMobileProps {
  match: any;
  isRequester: boolean;
  onSelect: (message: string) => void;
}

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

interface TemplateDefinition {
  icon: MaterialIconName;
  text: string;
}

export function TemplateMessagesMobile({ match, isRequester, onSelect }: TemplateMessagesMobileProps) {
  const trip = Array.isArray(match.trips) ? match.trips[0] : match.trips;
  const request = Array.isArray(match.requests) ? match.requests[0] : match.requests;

  const transportIcon: MaterialIconName = trip?.type === 'boat' ? 'directions-boat' : 'flight';

  const templates: TemplateDefinition[] = isRequester
    ? [
        {
          icon: 'chat',
          text: "Hi! I can take your item – when/where should we meet?",
        },
        {
          icon: transportIcon,
          text: trip?.type === 'boat' ? "Here's my boat: [photo]" : "Here's my flight: [details]",
        },
        {
          icon: 'attach-money',
          text: `Agreed on $${match.reward_amount?.toLocaleString()}?`,
        },
      ]
    : [
        {
          icon: 'chat',
          text: "Thanks! I can meet at [location] on [date]",
        },
        {
          icon: 'attach-money',
          text: `Yes, $${match.reward_amount?.toLocaleString()} works for me!`,
        },
      ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick messages:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
        {templates.map((template, index) => (
          <TouchableOpacity
            key={index}
            style={styles.templateButton}
            onPress={() => onSelect(template.text)}
          >
            <MaterialIcons name={template.icon} size={16} color="#14b8a6" />
            <Text style={styles.templateText} numberOfLines={2}>
              {template.text}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  title: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  scrollView: {
    flexGrow: 0,
  },
  templateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f0fdfa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#14b8a6',
    marginRight: 8,
    maxWidth: 200,
  },
  templateText: {
    fontSize: 12,
    color: '#14b8a6',
    fontWeight: '500',
  },
});

