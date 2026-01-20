import { Voice } from '@twilio/voice-react-native-sdk';
import RNCallKeep from 'react-native-callkeep';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { api } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

class VoiceService {
  private voice: Voice | null = null;
  private isInitialized = false;

  async init() {
    if (this.isInitialized) return;

    try {
      // 1. Initialize CallKeep
      const options = {
        ios: {
          appName: 'COD Express',
        },
        android: {
          alertTitle: 'Permissions required',
          alertDescription: 'This application needs to access your phone accounts',
          cancelButton: 'Cancel',
          okButton: 'ok',
          imageName: 'sim_icon',
          additionalPermissions: [PermissionsAndroid.PERMISSIONS.READ_CONTACTS],
          selfManaged: true,
        },
      };

      if (RNCallKeep) {
        await RNCallKeep.setup(options);
        RNCallKeep.setAvailable(true);
        console.log('CallKeep Setup Complete');
      } else {
        console.warn('RNCallKeep is null. Native module might not be linked.');
      }

      // 2. Initialize Twilio Voice
      this.voice = new Voice();
      
      this.setupEventListeners();
      
      this.isInitialized = true;
      console.log('Voice Service Initialized, RNCallKeep status:', !!RNCallKeep);
    } catch (error) {
      console.error('Voice Service Init Error:', error);
    }
  }

  private setupEventListeners() {
    if (!this.voice) return;

    this.voice.on(Voice.Event.CallInvite, (invite: any) => {
      console.log('Received Call Invite:', invite);
      const from = invite.getFrom();
      const callSid = invite.getCallSid();
      
      // Show incoming call UI via CallKeep
      if (RNCallKeep) {
        RNCallKeep.displayIncomingCall(callSid, from, 'Rider Support');
      }
      
      // Handle acceptance
      if (RNCallKeep) {
        RNCallKeep.addEventListener('answerCall', async ({ callUUID }) => {
          if (callUUID === callSid) {
            await invite.accept();
          }
        });

        // Handle rejection
        RNCallKeep.addEventListener('endCall', async ({ callUUID }) => {
          if (callUUID === callSid) {
            await invite.reject();
          }
        });
      }
    });

    this.voice.on(Voice.Event.Registered, () => {
      console.log('✅ Voice SDK: Device registered successfully');
    });

    this.voice.on(Voice.Event.Unregistered, () => {
      console.log('ℹ️ Voice SDK: Device unregistered');
    });

    this.voice.on(Voice.Event.Error, (error) => {
      console.error('❌ Twilio Voice Error:', error);
    });
  }

  async register() {
    if (!this.voice) await this.init();
    
    try {
      const response: any = await api.post('/voice/token', {});
      if (response.success && response.data.token) {
        console.log('Registering device with identity:', response.data.identity);
        await this.voice?.register(response.data.token);
      }
    } catch (error) {
      console.error('Voice Registration Error:', error);
    }
  }

  async requestAndroidPermissions() {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
        ]);
        return (
          granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED &&
          granted[PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE] === PermissionsAndroid.RESULTS.GRANTED
        );
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  }

  async makeCall(to: string) {
    if (!this.voice) await this.init();

    const hasPermission = await this.requestAndroidPermissions();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Microphone and Phone permissions are required to make calls.');
      return;
    }

    try {
      console.log('Fetching voice token for call to:', to);
      const response: any = await api.post('/voice/token', {});
      if (response.success && response.data.token) {
        console.log('Connecting call via Twilio Voice...');
        const call: any = await this.voice?.connect(response.data.token, {
          params: { To: to },
        });

        if (!call) {
          throw new Error('Failed to create call connection');
        }

        if (RNCallKeep) {
          const sid = call.getSid ? call.getSid() : Date.now().toString();
          RNCallKeep.startCall(sid, to, to);
        }
        
        return call;
      } else {
         throw new Error('Failed to get voice token from server');
      }
    } catch (error: any) {
      console.error('Make Call Error:', error);
      const errorMessage = error?.message || 'Unable to connect your call.';
      Alert.alert('Call Error', `${errorMessage} Please try again or use direct dial.`);
      throw error;
    }
  }

  async endAllCalls() {
    if (RNCallKeep) {
      RNCallKeep.endAllCalls();
    }
  }
}

export const voiceService = new VoiceService();
