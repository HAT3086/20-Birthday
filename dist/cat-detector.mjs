let loading;
function script(src) {
  return new Promise((resolve, reject) => {
    const element = document.createElement('script');
    element.src = new URL(src, import.meta.url).href;
    element.onload = resolve;
    element.onerror = () => { element.remove(); reject(new Error('Detector download failed')); };
    document.head.append(element);
  });
}

export function loadCatDetector() {
  loading ||= (async () => {
    if (!window.tf) await script('./vendor/cat-check/tf.min.js');
    if (!window.cocoSsd) await script('./vendor/cat-check/coco-ssd.min.js');
    await window.tf.ready();
    try { await window.tf.setBackend('webgl'); await window.tf.ready(); }
    catch { await window.tf.setBackend('cpu'); await window.tf.ready(); }
    return window.cocoSsd.load({ base: 'lite_mobilenet_v2', modelUrl: new URL('./vendor/cat-check/model.json', import.meta.url).href });
  })().catch(error => { loading = null; throw error; });
  return loading;
}
