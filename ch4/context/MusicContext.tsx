import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

type MusicContextType = {
  isMusicOn: boolean;
  setIsMusicOn: (v: boolean) => void;
  selectedMusic: number;
  setSelectedMusic: (v: number) => void;
  isReady: boolean;
  backgroundSoundRef: React.MutableRefObject<Audio.Sound | null>; // ✅ 추가
};

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMusicOn, setIsMusicOnState] = useState(true);
  const [selectedMusic, setSelectedMusicState] = useState(1);
  const [isReady, setIsReady] = useState(false);
  const backgroundSoundRef = useRef<Audio.Sound | null>(null); // ✅ 추가

  useEffect(() => {
    const loadStoredState = async () => {
      const storedMusic = await AsyncStorage.getItem('isMusicOn');
      const storedChoice = await AsyncStorage.getItem('selectedMusic');

      if (storedMusic !== null) setIsMusicOnState(storedMusic === 'true');
      if (storedChoice !== null) setSelectedMusicState(Number(storedChoice));

      setIsReady(true);
    };

    loadStoredState();
  }, []);

  const setIsMusicOn = async (value: boolean) => {
    setIsMusicOnState(value);
    await AsyncStorage.setItem('isMusicOn', value.toString());
  };

  const setSelectedMusic = async (value: number) => {
    setSelectedMusicState(value);
    await AsyncStorage.setItem('selectedMusic', value.toString());
  };

  return (
    <MusicContext.Provider
      value={{
        isMusicOn,
        setIsMusicOn,
        selectedMusic,
        setSelectedMusic,
        isReady,
        backgroundSoundRef, // ✅ 포함
      }}
    >
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) throw new Error('useMusic must be used within MusicProvider');
  return context;
};
