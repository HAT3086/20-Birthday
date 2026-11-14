export const BREEDS = Object.freeze([
  { id: 'original', name: 'Original', fur: '#fff0cd', shade: '#f2dbac', light: '#fff4dc', outline: '#827359', eye: '#3d493b', ear: '#f2b1a0', markings: '#d6bc8e' },
  { id: 'british', name: 'British Shorthair', fur: '#a5b2bd', shade: '#8798a7', light: '#c2cbd0', outline: '#596b78', eye: '#a27737', ear: '#d4aaa9', markings: '#718594' },
  { id: 'siamese', name: 'Siamese', fur: '#ede2cb', shade: '#d2c2a3', light: '#fbefda', outline: '#705d52', eye: '#87bed0', ear: '#b78c85', markings: '#8a7268' },
  { id: 'orange', name: 'Orange', fur: '#e1a362', shade: '#ce8b49', light: '#f2c58e', outline: '#92613f', eye: '#596d49', ear: '#e5ac94', markings: '#b8783d' },
  { id: 'ragdoll', name: 'Ragdoll', fur: '#eeeade', shade: '#d5d1c4', light: '#faf5e8', outline: '#8c8982', eye: '#78aabe', ear: '#d7b1aa', markings: '#a5a19b' },
].map(Object.freeze));

// Carry a previously selected Bengal over to its replacement.
export const breedFor = id => BREEDS.find(breed => breed.id === (id === 'bengal' ? 'orange' : id)) || BREEDS[0];
