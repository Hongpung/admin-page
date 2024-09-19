import { redirect } from 'next/navigation';

export default function User() {
    const today = new Date();
    redirect(`/reserve/live/${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}`)

    return (
        null
    );
}