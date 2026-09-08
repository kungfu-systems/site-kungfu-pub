import { useSyncExternalStore } from 'react';
import { PROFILE_STORAGE_KEY, profileFor, type ProfileId } from '../data/learner-profiles';
let current: ProfileId = 'explore';
let initialized = false;
let saving = true;
const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((listener) => listener());
}
function initialize() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;
  try {
    current = profileFor(localStorage.getItem(PROFILE_STORAGE_KEY)).id;
  } catch {
    saving = false;
  }
  window.addEventListener('storage', (event) => {
    if (event.key !== PROFILE_STORAGE_KEY && event.key !== null) return;
    current = profileFor(event.newValue).id;
    emit();
  });
}
function subscribe(listener: () => void) {
  initialize();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function setLearnerProfile(value: string) {
  initialize();
  current = profileFor(value).id;
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, current);
    saving = true;
  } catch {
    saving = false;
  }
  emit();
}
export function useLearnerProfile() {
  const id = useSyncExternalStore(
    subscribe,
    () => current,
    () => 'explore' as ProfileId,
  );
  const persistent = useSyncExternalStore(
    subscribe,
    () => saving,
    () => true,
  );
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  return { profile: profileFor(id), persistent, ready, setProfile: setLearnerProfile };
}
