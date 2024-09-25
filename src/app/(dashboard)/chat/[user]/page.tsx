'use client'

import { useCallback, useEffect, useState } from "react"

function delay(ms: number): Promise<{ json: () => Promise<Message[]> }> {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(
                {
                    json: () => Promise.resolve([
                        { "user": "admin", "message": "Welcome to our platform!", "timestamp": "2024-09-19T12:00:00Z" },
                        { "user": "customer", "message": "Thank you! How do I get started?", "timestamp": "2024-09-19T12:01:00Z" },
                        { "user": "customer", "message": "Thank you! How do I get started?", "timestamp": "2024-09-19T12:01:00Z" },
                        { "user": "admin", "message": "You can begin by setting up your profile.", "timestamp": "2024-09-19T12:02:00Z" },
                        { "user": "customer", "message": "I’ve done that. What’s next?", "timestamp": "2024-09-19T12:03:00Z" },
                        { "user": "admin", "message": "You can explore the available products and make a purchase.", "timestamp": "2024-09-19T12:04:00Z" },
                        { "user": "customer", "message": "Great! How can I check the latest deals?", "timestamp": "2024-09-19T12:05:00Z" },
                        { "user": "admin", "message": "Visit the 'Deals' section under the menu.", "timestamp": "2024-09-19T12:06:00Z" },
                        { "user": "customer", "message": "Thanks! I’ll take a look.", "timestamp": "2024-09-19T12:07:00Z" },
                        { "user": "admin", "message": "Let us know if you need any help.", "timestamp": "2024-09-19T12:08:00Z" },
                        { "user": "customer", "message": "I will. How do I contact support?", "timestamp": "2024-09-19T12:09:00Z" },
                        { "user": "admin", "message": "You can use the 'Contact Us' form for support.", "timestamp": "2024-09-19T12:10:00Z" },
                        { "user": "customer", "message": "Alright, I’ll keep that in mind.", "timestamp": "2024-09-19T12:11:00Z" },
                        { "user": "admin", "message": "We also have live chat for immediate assistance.", "timestamp": "2024-09-19T12:12:00Z" },
                        { "user": "customer", "message": "That’s good to know!", "timestamp": "2024-09-19T12:13:00Z" },
                        { "user": "admin", "message": "Feel free to browse our tutorials for more info.", "timestamp": "2024-09-19T12:14:00Z" },
                        { "user": "customer", "message": "I’ll check those out, thanks!", "timestamp": "2024-09-19T12:15:00Z" },
                        { "user": "admin", "message": "Happy to help. Enjoy your experience!", "timestamp": "2024-09-19T12:16:00Z" },
                        { "user": "customer", "message": "I’m loving it so far. Thanks for your assistance!", "timestamp": "2024-09-19T12:17:00Z" },
                        { "user": "admin", "message": "Glad to hear that! We’re always here if you need anything.", "timestamp": "2024-09-19T12:18:00Z" },
                        { "user": "customer", "message": "Perfect. I’ll explore more of the features.", "timestamp": "2024-09-19T12:19:00Z" }
                    ]
                    )
                }
            )
        }, ms);
    });
}

interface Message { user: string, message: string, timestamp: string };
export default function ChatRoom({ params }: { params: { user: string } }) {
    const [message, setMessage] = useState('');
    const [messagesBucket, setBucket] = useState<Message[]>([]); // 오타 수정: messege -> message

    useEffect(() => {
        const loadMessage = async () => {
            const response = await delay(200);
            const data = await response?.json();
            setBucket(data); // 받아온 데이터를 상태로 설정
        };
        loadMessage();

    }, []);

    const formatTime = useCallback((timestamp: string): string => {
        const date = new Date(timestamp);
        const originHours = date.getHours(); // 시간 추출
        const isAfternoon = originHours > 12;
        const hours = isAfternoon ? (originHours - 12).toString().padStart(2, '0') : originHours.toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0'); // 분 추출
        const noonText = isAfternoon ? '오후' : '오전';
        return `${noonText} ${hours}:${minutes}`; // HH:mm 형식으로 반환
    }, [])

    const sendMessage = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const message = formData.get('message') as string;
        if (message.length == 0) return;
        const timestamp = new Date().toISOString();
        setBucket([{ message, user: 'admin', timestamp }, ...messagesBucket]);
        setMessage('');
    };

    useEffect(() => {
        console.log(messagesBucket)
    }, [messagesBucket])
    return (
        <div className="flex-grow flex flex-col">
            <div className="py-2 border-b px-2 text-xl font-semibold flex flex-row items-center">
                <div className="w-12 h-12 mr-4 bg-slate-400 rounded-full" />
                {params.user}와 채팅화면
            </div>
            <div className="flex-grow overflow-y-scroll flex flex-col-reverse px-4 gap-4 py-2">
                {messagesBucket.map((obj, index) => {
                    const isAdmin = obj.user == 'admin';
                    const msgStyle = isAdmin ? 'bg-blue-600 text-white' : 'bg-gray-200';
                    const flexStyle = isAdmin ? 'flex-row-reverse self-end' : 'flex-row';
                    return (
                        <div className="flex flex-col gap-2">
                            {!isAdmin && (messagesBucket[index + 1]?.user != obj.user) && <div><div className="w-2 h-2" /> {obj.user}</div>}
                            <div className={`flex items-end gap-2 ${flexStyle}`}>
                                <div className={`px-4 py-2 rounded-md max-w-64 ${msgStyle}`}>
                                    {obj.message}
                                </div>
                                {((formatTime(messagesBucket[index - 1]?.timestamp) != formatTime(obj.timestamp))
                                    || (messagesBucket[index - 1]?.user != obj.user) || (!messagesBucket[index - 1]))
                                    &&
                                    <div className="font-normal text-gray-400 text-sm">
                                        {formatTime(obj.timestamp)}
                                    </div>}
                            </div>
                        </div>
                    )
                })}
            </div>
            <form className="flex flex-row items-center py-2 my-4 mx-2 px-4 border rounded-full gap-2"
                onSubmit={sendMessage}>
                {/* <div className="w-8 h-8 bg-gray-200 cursor-pointer">imogi</div> */}
                <input type="text" name="message" value={message} onChange={(e) => { setMessage(e.currentTarget.value) }} className="px-2 flex-grow text-xl outline-none" placeholder="메세지 입력..." autoFocus={true} />
                {message.length > 0 ?
                    <button className="text-blue-400 font-semibold cursor-pointer h-8 flex-col flex justify-center">
                        전송
                    </button> :
                    <>

                        <label htmlFor="pic-input">
                            <div className="w-8 h-8 bg-blue-400 cursor-pointer" />
                        </label>
                        <input type="file" id="pic-input"  accept=".png, .jpg, .jpeg"  multiple className="hidden" />
                    </>
                }
            </form>
        </div>
    )
}