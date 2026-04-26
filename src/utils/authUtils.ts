import { User } from 'firebase/auth';

export const checkIsBos = (user: User | null, role: string | null) => {
  if (!user) return false;
  return (
    role === 'bos' || 
    user.email === 'alfathpulsa27@gmail.com' || 
    user.uid === 'RU9vfuH9VyS6arM2kRFJ9eEpAeL2'
  );
};

export const checkIsMandor = (role: string | null) => {
  return role === 'mandor';
};
