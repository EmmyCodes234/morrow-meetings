export interface AvatarMeta {
  id: string;
  label: string;
  bgColor: string;
}

export const POPSPACE_AVATARS: AvatarMeta[] = [
  { id: 'avocado', label: 'Avocado', bgColor: '#E4FBF8' },
  { id: 'black_cat', label: 'Black Cat', bgColor: '#F3F2FE' },
  { id: 'blue_robot', label: 'Blue Robot', bgColor: '#EEF8FF' },
  { id: 't_rex', label: 'T-Rex', bgColor: '#FFF5DD' },
  { id: 'unicorn', label: 'Unicorn', bgColor: '#FDEEEC' },
  { id: 'donut', label: 'Donut', bgColor: '#FDEEEC' },
  { id: 'bear', label: 'Bear', bgColor: '#FFF5DD' },
  { id: 'croissant', label: 'Croissant', bgColor: '#FFF5DD' },
  { id: 'ice_cream', label: 'Ice Cream', bgColor: '#F3F2FE' },
  { id: 'orange_cat', label: 'Orange Cat', bgColor: '#FFF5DD' },
  { id: 'pineapple', label: 'Pineapple', bgColor: '#FFF5DD' },
  { id: 'red_robot', label: 'Red Robot', bgColor: '#FDEEEC' },
  { id: 'retriever', label: 'Golden Pup', bgColor: '#FFF5DD' },
  { id: 'sun', label: 'Sunny', bgColor: '#FFF5DD' },
  { id: 'taco', label: 'Taco', bgColor: '#FFF5DD' },
  { id: 'cake', label: 'Cake', bgColor: '#FDEEEC' },
  { id: 'comet', label: 'Comet', bgColor: '#EEF8FF' },
  { id: 'earth', label: 'Earth', bgColor: '#E4FBF8' },
  { id: 'parrot', label: 'Parrot', bgColor: '#E4FBF8' },
  { id: 'moon', label: 'Moon', bgColor: '#F3F2FE' },
  { id: 'leaf', label: 'Sprout', bgColor: '#E4FBF8' },
  { id: 'burger', label: 'Burger', bgColor: '#FFF5DD' },
  { id: 'baked_potato', label: 'Potato', bgColor: '#FFF5DD' },
  { id: 'abstract_frog', label: 'Frog', bgColor: '#E4FBF8' },
  { id: 'abstract_lion', label: 'Lion', bgColor: '#FFF5DD' },
  { id: 'abstract_pig', label: 'Piggy', bgColor: '#FDEEEC' },
  { id: 'abstract_rabbit', label: 'Rabbit', bgColor: '#F3F2FE' },
  { id: 'baseball', label: 'Baseball', bgColor: '#F4F5F8' },
  { id: 'basketball', label: 'Basketball', bgColor: '#FFF5DD' },
  { id: 'soccerball', label: 'Soccer', bgColor: '#F4F5F8' },
];

export function getRandomAvatar(): AvatarMeta {
  const index = Math.floor(Math.random() * POPSPACE_AVATARS.length);
  return POPSPACE_AVATARS[index];
}
