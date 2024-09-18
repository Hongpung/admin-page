import { redirect } from 'next/navigation';

export default function User() {

  redirect('/dashboard/user/accept')

  return (
    null
  );
}