import { redirect } from 'next/navigation';

export default function User() {

  redirect('/dashboard/reserve/live')

  return (
    null
  );
}