/* Types //////////////////////////////////////////////////////////////////////////////////////////////////////////// */

type NotifyType = 'success' | 'error';

/* Constants //////////////////////////////////////////////////////////////////////////////////////////////////////// */

const showDuration = 5000;

/* Initialization /////////////////////////////////////////////////////////////////////////////////////////////////// */

let containerElement: HTMLDivElement | null = null;

const ensureInitialization = () => {
  if (containerElement) {
    return;
  }

  // Create container element
  containerElement = document.createElement('div');
  containerElement.className = 'notify-toast-container';
  containerElement.style.setProperty('--duration', `${showDuration}ms`);
  document.body.appendChild(containerElement);
};

/* Toast creation /////////////////////////////////////////////////////////////////////////////////////////////////// */

const createToastElement = (type: NotifyType, message: string) => {
  const toastElement = document.createElement('div');
  toastElement.className = `notify-toast ${type}`;
  toastElement.textContent = message;
  return toastElement;
};

/* Notify /////////////////////////////////////////////////////////////////////////////////////////////////////////// */

const notify = (type: NotifyType, message: string) => {
  ensureInitialization();
  if (!containerElement) {
    return;
  }

  const toastElement = createToastElement(type, message);
  containerElement.appendChild(toastElement);

  setTimeout(() => {
    toastElement.remove();
  }, showDuration);
};

/* Compose ////////////////////////////////////////////////////////////////////////////////////////////////////////// */

export const useNotify = () => ({
  notify,
});
