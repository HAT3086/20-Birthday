export const COSTUMES = Object.freeze([
  { id: 'original', name: 'Original', price: 0, color: '#d9ddcb', description: 'No costume. Just your cat.' },
  { id: 'gardener', name: 'Garden Paws', price: 10, color: '#c8d1b8', description: 'A leafy hat for garden days.' },
  { id: 'sailor', name: 'Little Sailor', price: 20, color: '#c7d7d6', description: 'A sailor’s hat for the next voyage.' },
  { id: 'bee', name: 'Bumble Cat', price: 30, color: '#dfd3ab', description: 'A bee costume, complete with tiny wings.' },
  { id: 'wizard', name: 'Moon Wizard', price: 30, color: '#d3ccdf', description: 'A moonlit hat and a touch of magic.' },
  { id: 'astronaut', name: 'Space Mochi', price: 40, color: '#cdd3d8', description: 'A space suit for a curious cat.' },
  { id: 'birthday', name: 'Birthday Cat', price: 50, color: '#e0c8be', description: 'A party hat for your twentieth.' },
].map(Object.freeze));

export const costumeFor = id => COSTUMES.find(costume => costume.id === id) || COSTUMES[0];
