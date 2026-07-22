import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, useWindowDimensions, StyleSheet, ViewStyle , Platform } from 'react-native';
import { X, ChevronLeft } from 'lucide-react-native';
import { WEB_MODAL_CONTAINER } from '../../constants/theme';

interface CardLayoutWrapperProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  iconType?: 'close' | 'back';
  contentContainerStyle?: ViewStyle;
  footer?: React.ReactNode;
}

export default function CardLayoutWrapper({ title, onClose, children, iconType = 'close', contentContainerStyle, footer }: CardLayoutWrapperProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  return (
    <View style={{ flex: 1, backgroundColor: 'rgba(15, 17, 20, 0.95)', justifyContent: 'center' }}>
      <View style={[{ 
        flex: 1, 
        backgroundColor: '#22272B', 
        overflow: 'hidden', 
        borderRadius: isDesktop ? 12 : 0, 
        elevation: 10, 
        ...Platform.select({ web: { boxShadow: '0px 10px 20px rgba(0,0,0,0.3)' }, default: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 } }), 
      }, 
      WEB_MODAL_CONTAINER,
      isDesktop && { maxHeight: '90%', marginVertical: 'auto' }
      ]}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: isDesktop ? 20 : 60, backgroundColor: '#2C333A', borderBottomWidth: 1, borderBottomColor: '#384148' }}>
          <Text style={{ fontSize: 18, fontWeight: '900', color: '#B6C2CF' }}>
            {title.toUpperCase()}
          </Text>
          <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
            {iconType === 'close' ? <X size={28} color="#B6C2CF" /> : <ChevronLeft size={28} color="#B6C2CF" />}
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView contentContainerStyle={[{ padding: 24, paddingBottom: footer ? 100 : 24 }, contentContainerStyle]} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
        
        {/* Footer Opcional */}
        {footer}
      </View>
    </View>
  );
}
