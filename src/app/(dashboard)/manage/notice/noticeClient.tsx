'use client'

import "@admin/app/globals.css";
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Notice } from './types';
import { deleteNotice, loadNotices, loadSpecificNotice, registerNotice, updateNotice } from './utils';
import Modal from '../../modal';
import RBButton from '../../RBbutton';
import Image from "next/image";
import RefreshIcon from "@public/Refresh.svg"
import { debounce } from 'lodash';

export default function NoticeClientComponent({ initNotices }: { initNotices: Notice[] }) {

    const [notices, setNotices] = useState<Notice[]>(initNotices);

    const [noticeManageState, setNoticeManageState] = useState<"idle" | "create" | "modify">('idle')

    const [specificNoticeId, setSpecificNoticeId] = useState<number | null>(null)
    const [specificNotice, setSpecificNotice] = useState<Notice | null>(null)

    const iconRef = useRef<HTMLImageElement>(null)

    const refreshNoticesLogic = async () => {
        try {
            const refreshData = await loadNotices();

            setSpecificNoticeId(null);
            setNotices(refreshData)

        } catch (e) {
            console.error(e)
        }
    }

    const deleteNoticeLogic = useCallback(async (infoId: number) => {
        try {
            const result = await deleteNotice({ infoId })

            if (!result) throw Error('Failed Modify')

            alert('삭제했습니다.')
            refreshNoticesLogic();

        } catch (e: unknown) {
            console.error(e);
            if (e instanceof Error)
                alert('삭제에 실패했습니다. 다시 확인해주세요: ' + e?.message)
        }
    }, [notices])

    const loadSpecificNoticeLogic = useCallback(async (infoId: number) => {
        try {
            const result: Notice = await loadSpecificNotice(infoId)

            if (!result) throw Error('Failed Modify')

            setSpecificNotice(result)

        } catch (e: unknown) {
            console.error(e);
            if (e instanceof Error)
                alert('불러오기에 실패했습니다. 다시 확인해주세요: ' + e?.message)
        }
    }, [])

    useEffect(() => {
        if (specificNoticeId)
            loadSpecificNoticeLogic(specificNoticeId)

    }, [specificNoticeId])

    return (<>
        <RBButton
            color="gray"
            onClick={() => setNoticeManageState('create')}
        >
            +
        </RBButton>
        <div className='relative w-full max-h-auto h-full flex flex-row gap-4'>
            <div className="min-w-96 max-h-full h-96 flex flex-col border rounded-md py-3 overflow-hidden">
                <div className="font-semibold px-4 ">공지사항 관리</div>

                <div className='flex flex-row justify-end w-full px-4 cursor-pointer'
                    onClick={
                        debounce(() => {
                            refreshNoticesLogic();
                            iconRef.current?.classList.add('spin-animation');
                            setTimeout(() => {
                                iconRef.current?.classList.remove('spin-animation');
                            }, 500)
                        }, 2000, { leading: true, trailing: false })
                    }>
                    <Image ref={iconRef} src={RefreshIcon} width={16} alt="refresh" className='transition-transform duration-1000' />
                </div>
                {notices.length == 0 ?
                    <div className="flex flex-col items-center py-24 text-gray-400">공지사항이 없습니다.</div>
                    :
                    <div className='flex flex-col flex-grow overflow-y-auto gap-2 mt-4 px-2'>
                        {notices.map(info => (
                            <div key={info.noticeId} className='px-4 py-2 border rounded-md flex flex-row items-center cursor-pointer'
                                onClick={() => {
                                    setSpecificNoticeId(info.noticeId);
                                }}>
                                <div className='flex-grow text-lg font-semibold'>
                                    {info.title}
                                </div>
                                <div className='flex flex-col justify-end items-end h-12'>
                                    <span className='text-sm text-gray-400'>{info.updatedAt.split('T')[0]}</span>
                                    <span className='text-xs text-gray-400'>{info.updatedAt.split('T')[1].split('.')[0]}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                }
            </div>

            <div className="flex flex-col w-full h-full border rounded-md px-4 py-3">
                {specificNotice ?
                    <>
                        <div className="font-light text-gray-400 text-sm">상세</div>
                        <div className='py-2 h-24 flex flex-row items-center'>
                            <div className='self-start flex-grow text-lg font-semibold'>
                                {specificNotice.title}
                            </div>
                            <div className='flex flex-col justify-end items-end h-12'>
                                <span className='text-sm text-gray-400'>{specificNotice.updatedAt.split('T')[0]}</span>
                                <span className='text-xs text-gray-400'>{specificNotice.updatedAt.split('T')[1].split('.')[0]}</span>
                            </div>

                        </div>
                        <div className='flex-grow px-2'>
                            {specificNotice.content}
                        </div>
                        <div className='flex flex-row items-center justify-end gap-4'>
                            <div className='cursor-pointer px-2 py-0.5 flex items-center rounded text-white bg-green-300 font-semibold justify-center'
                                onClick={() => setNoticeManageState('modify')}>
                                수정
                            </div>
                            <div className='cursor-pointer px-2 py-0.5 flex items-center rounded text-white bg-red-300 font-semibold justify-center'
                                onClick={() => { if (confirm(`${specificNotice.title}을 삭제하시겠습니까?`)) (deleteNoticeLogic(specificNotice.noticeId)) }}>
                                삭제
                            </div>
                        </div>
                    </>
                    :
                    <div className='self-center text-lg font-semibold py-32 h-full'>좌측에서 공지를 선택해주세요</div>

                }

            </div>
        </div>
        <ModifyModal isOpen={noticeManageState == 'modify'} notice={specificNotice!} close={(boolean) => { setNoticeManageState('idle'); if (boolean) refreshNoticesLogic(); }} />
        <CreateModal isOpen={noticeManageState == 'create'} close={(boolean) => { setNoticeManageState('idle'); if (boolean) refreshNoticesLogic(); }} />
    </>

    )
}


const ModifyModal = ({ isOpen, notice, close }: { isOpen: boolean, notice: Notice, close: (boolean: boolean) => void }) => {

    const modifyNotice = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const title = formData.get('title') as string;
        const content = formData.get('content') as string;
        const noticeAll = formData.get('noticeAll') ? true : false;
        const noticeId = notice.noticeId;

        console.log(noticeId)

        try {
            if (!noticeId) {
                console.error('invalid infoId');
                throw Error('invalid InfoId');
            }
            const result = await updateNotice({ title, content, infoId: noticeId, noticeAll })

            if (!result) throw Error('Failed Modify')

            close(true);
            alert('수정되었습니다.')

        } catch (e: unknown) {
            console.error(e);
            if (e instanceof Error)
                alert('수정에 실패했습니다. 다시 확인해주세요: ' + e?.message)
        }
    }

    return (
        <div>
            <Modal isOpen={isOpen}>
                <div className='absolute top-4 right-4 cursor-pointer w-4 h-4' onClick={() => close(false)}>X</div>
                <form className='mt-4 flex-col flex gap-2' onSubmit={modifyNotice}>
                    <div className='text-lg font-semibold'>수정</div>

                    <div className='flex flex-row justify-between'>
                        <span className='text-gray-400'>제목</span>
                        <input required placeholder='제목을 입력하세요' type="text" name="title" defaultValue={notice?.title} className='border-b w-96 text-right px-2' />
                    </div>

                    <div className='flex flex-col gap-2'>
                        <span className='text-gray-400'>내용</span>
                        <textarea required placeholder='내용을 입력하세요' name="content" className='min-h-96 border rounded-md px-2 py-2' defaultValue={notice?.content} />
                    </div>

                    <div className='flex flex-row justify-end mt-4 items-center gap-4'>
                        <label htmlFor="noticeAll" className="flex flex-row gap-1">
                            <input type="checkbox" name="noticeAll" id="noticeAll" className="peer " />
                            <span className="text-gray-400 peer-checked:text-black">전체 알림</span>
                        </label>
                        <button type='submit' className='flex items-center justify-center px-2 py-0.5 bg-green-400 font-semibold text-white rounded'>변경사항 저장</button>
                    </div>

                </form>
            </Modal>
        </div>
    )
}

const CreateModal = ({ isOpen, close }: { isOpen: boolean, close: (boolean: boolean) => void }) => {

    const createNotice = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const title = formData.get('title') as string;
        const content = formData.get('content') as string;
        const noticeAll = formData.get('noticeAll') ? true : false;

        try {
            const result = await registerNotice({ title, content, noticeAll })

            if (!result) throw Error('Failed Modify')

            close(true);
            alert('등록되었습니다.')

        } catch (e: unknown) {
            console.error(e);
            if (e instanceof Error)
                alert('등록에 실패했습니다. 다시 확인해주세요: ' + e?.message)
        }
    }

    return (
        <div>
            <Modal isOpen={isOpen}>
                <div className='absolute top-4 right-4 cursor-pointer w-4 h-4' onClick={() => close(false)}>X</div>
                <form className='mt-4 flex-col flex gap-2' onSubmit={createNotice}>
                    <div className='text-lg font-semibold'>게시</div>
                    <div className='flex flex-row justify-between'>
                        <span className='text-gray-400'>제목</span>
                        <input required placeholder='제목을 입력하세요' type="text" name="title" className='border-b text-right px-2 w-96' />
                    </div>

                    <div className='flex flex-col gap-2'>
                        <span className='text-gray-400'>내용</span>
                        <textarea required placeholder='내용을 입력하세요' name="content" className='min-h-96 border rounded-md px-2 py-2' />
                    </div>
                    <div className='flex flex-row justify-end mt-4 items-center gap-4'>
                        <label htmlFor="noticeAll" className="flex flex-row gap-1">
                            <input type="checkbox" name="noticeAll" id="noticeAll" className="peer " />
                            <span className="text-gray-400 peer-checked:text-black">전체 알림</span>
                        </label>
                        <button type='submit' className='flex items-center justify-center px-3 py-1 bg-blue-400 font-semibold text-white rounded'>게시</button>
                    </div>

                </form>
            </Modal>
        </div>
    )
}