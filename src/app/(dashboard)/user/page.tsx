import { redirect } from 'next/navigation';

export default function User() {

  redirect('/user/accept')

  return (
    null
  );
}