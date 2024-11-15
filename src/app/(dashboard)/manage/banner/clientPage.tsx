'use client'
import React, { useCallback, useEffect, useState } from "react"
import Modal from "../../modal"
import { BannerCreateDTO as BannerCreateDTO, BannerDTO as BannerDTO, BannerUpdateDTO } from "./types";
import RBButton from "../../RBbutton";
import { createBanner, deleteBanner, loadActiveBanners, loadOldBanners, loadPlannedBanners, updateBanner, uploadImage } from "./utils";
import { throttle } from "lodash";
import LoadingDots from "@admin/app/components/loadingindicator";

type ModalType = 'Create' | 'Update'

export default function BannerManageClientPage({ initActiveBanners, initOldBanners, initPlannedBanners }: { initActiveBanners: BannerDTO[], initOldBanners: BannerDTO[], initPlannedBanners: BannerDTO[] }) {

    const [activeBanners, setActiveBanners] = useState<BannerDTO[]>(initActiveBanners || [])
    const [oldBanners, setOldBanners] = useState<BannerDTO[]>(initOldBanners || [])
    const [plannedBanners, setPlannedBanners] = useState<BannerDTO[]>(initPlannedBanners || [])
    const [isLoading, setLoading] = useState(false);
    const [modalState, setModalState] = useState<{ state: ModalType, banner?: BannerDTO } | null>(null);

    const handleSubmitCreateBanner = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        const formData = new FormData(event.currentTarget);
        const owner = formData.get('owner') as string;
        const startDateString = formData.get('startDate') as string;
        const startDate = new Date(startDateString);
        const endDateString = formData.get('endDate') as string;
        const href = formData.get('banner-href') as string;
        const endDate = new Date(endDateString);
        const bannerImg = formData.get('banner-image') as File;

        if (startDate > endDate) {
            alert(`날짜를 다시 확인해주세요`)
            setLoading(false);
            return;
        }

        if ((endDate < new Date())) {
            alert(`날짜를 다시 확인해주세요`)
            setLoading(false);
            return;
        }

        try {
            const imageFormData = new FormData();
            imageFormData.append('banner-image', bannerImg, `${owner}-${(new Date).toISOString()}`);

            const imageURL = await uploadImage(imageFormData);

            const bannerData: BannerCreateDTO = {
                owner,
                startDate,
                endDate,
                bannerImgUrl: imageURL
            }

            if (href) bannerData.href = href;

            const bannerId = await createBanner({ bannerData }) as string

            if (!bannerId) throw Error('it\' null!');

            await refreshBanners();
            setModalState(null);

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitUpdateBanner = async ({ event, updatedPart, originBanner }: { event: React.FormEvent<HTMLFormElement>, updatedPart: { [key: string]: boolean }, originBanner: BannerDTO }) => {

        event.preventDefault();
        setLoading(true);
        const formData = new FormData(event.currentTarget);
        const bannerUpdateData: BannerUpdateDTO = {
            id: originBanner.id
        }

        const owner = formData.get('owner') as string;

        const startDateString = formData.get('startDate') as string;
        const startDate = new Date(startDateString);

        const endDateString = formData.get('endDate') as string;
        const endDate = new Date(endDateString);

        const href = formData.get('banner-href') as string;

        const bannerImg = formData.get('banner-image') as File;

        if (updatedPart["owner"]) {
            bannerUpdateData.owner = owner;
        }

        if (updatedPart["startDate"]) {
            bannerUpdateData.startDate = startDate;
        }
        if (updatedPart["endDate"]) {

            bannerUpdateData.endDate = endDate;
        }
        if (updatedPart["banner-href"]) {
            bannerUpdateData.href = href;
        }

        if (startDate && endDate)
            if (startDate > endDate) {
                alert(`날짜를 다시 확인해주세요`)
                setLoading(false);
                return;
            }

        if ((endDate < new Date())) {
            alert(`날짜를 다시 확인해주세요`)
            setLoading(false);
            return;
        }

        try {
            if (updatedPart["banner-image"]) {
                const imageFormData = new FormData();
                imageFormData.append('banner-image', bannerImg, `${owner}-${(new Date).toISOString()}`);

                const imageURL = await uploadImage(imageFormData);

                bannerUpdateData.bannerImgUrl = await imageURL;
            }

            const updateBannerData = await updateBanner({ bannerUpdateData }) as BannerDTO;

            if (!updateBannerData) throw Error('it\' null!');

            await refreshBanners();
            setModalState(null);

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const bannerDeleteHadler = useCallback((bannerId: string, bannerStatus: 'OLD' | 'PLANNED' | 'ACTIVE') => {
        const deleteFetch = async () => {
            try {
                setLoading(true);
                await deleteBanner(bannerId);

                switch (bannerStatus) {
                    case "OLD": {
                        const changedBanners = oldBanners.filter(ban => ban.id != bannerId)
                        setOldBanners(changedBanners)
                        break;
                    }
                    case "PLANNED": {
                        const changedBanners = plannedBanners.filter(ban => ban.id != bannerId)
                        setPlannedBanners(changedBanners)
                        break;
                    }
                    case "ACTIVE": {
                        const changedBanners = activeBanners.filter(ban => ban.id != bannerId)
                        setActiveBanners(changedBanners)
                        break;
                    }
                }

            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false);
            }
        }
        deleteFetch();
    }, [oldBanners, plannedBanners, activeBanners])

    const refreshBanners = async () => {
        try {
            const loadedPlannedBanners = await loadPlannedBanners();
            const loadedOldBanners = await loadOldBanners();
            const loadedActiveBanners = await loadActiveBanners();

            if (!loadedActiveBanners || !loadedOldBanners || !loadedPlannedBanners) throw Error()

            setOldBanners(loadedOldBanners);
            setPlannedBanners(loadedPlannedBanners);
            setActiveBanners(loadedActiveBanners);

        } catch (e) {
            console.error(e)
            alert('인터넷을 확인해주세요')
        }
    }
    return (
        <>
            <div className="px-4 w-full h-full py-2">
                <RBButton
                    color="gray"
                    onClick={() => setModalState({ state: 'Create' })}
                >
                    +
                </RBButton>

                <div className="w-full h-full border rounded-md px-4 py-3">
                    <div className="font-semibold">배너 관리 페이지</div>
                    <div className="w-full flex flex-col gap-4 py-8">
                        <div className="font-semibold text-gray-400">현재 사용중인 배너</div>
                        {activeBanners.length == 0 ?
                            <div className="text-gray-300 flex flex-col justify-center self-center min-h-32">
                                <div>해당 되는 배너가 없습니다...</div>
                            </div>
                            :
                            <div className="w-full felx flex-col gap-4">
                                {activeBanners.map(banner => (
                                    <div key={banner.id} className="flex flex-row gap-8 px-12 py-2 justify-center">
                                        <div className="relative rounded-md overflow-hidden" style={{ height: 120, width: 360 }} >
                                            <img src={banner.bannerImgUrl} style={{ height: 120, width: '100%', objectFit: 'cover', objectPosition: 'center', }} />
                                        </div>
                                        <div className="flex flex-col gap-2 py-2">
                                            <div className="text-sm"> 배너 요청: <span className="text-sm font-semibold">{banner.owner}</span></div>
                                            <div className="text-sm"> 게시 날짜: <span className="text-sm font-semibold">{new Date(banner.startDate).toISOString().split('T')[0]}</span> ~ <span className="font-semibold">{new Date(banner.endDate).toISOString().split('T')[0]}</span></div>
                                            <div className="flex flex-row justify-end gap-6 mt-2">
                                                <div className="flex items-center justify-center px-2 py-0.5 cursor-pointer rounded-md text-sm bg-green-200" onClick={() => {
                                                    setModalState({ state: 'Update', banner: banner })
                                                }}
                                                >변경</div>
                                                <div className="flex items-center justify-center px-2 py-0.5 cursor-pointer rounded-md text-sm bg-red-200"
                                                    onClick={(e) => {
                                                        if (confirm('배너를 삭제하시겠습니까?')) bannerDeleteHadler(banner.id, 'ACTIVE');
                                                    }}>삭제</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}</div>}
                        <div className="font-semibold text-gray-400">추후 노출 예정인 배너</div>
                        {plannedBanners.length == 0 ?
                            <div className="text-gray-300 flex flex-col justify-center self-center min-h-32">
                                <div>해당 되는 배너가 없습니다...</div>
                            </div>
                            :
                            <div className="w-full felx flex-col gap-4">
                                {plannedBanners.map(banner => (
                                    <div key={banner.id} className="flex flex-row gap-8 px-12 py-2 justify-center">
                                        <div className="relative rounded-md overflow-hidden" style={{ height: 120, width: 360 }} >
                                            <img src={banner.bannerImgUrl} style={{ height: 120, width: '100%', objectFit: 'cover', objectPosition: 'center', }} />
                                        </div>
                                        <div className="flex flex-col gap-2 py-2">
                                            <div className="text-sm"> 배너 요청: <span className="text-sm font-semibold">{banner.owner}</span></div>
                                            <div className="text-sm"> 게시 날짜: <span className="text-sm font-semibold">{new Date(banner.startDate).toISOString().split('T')[0]}</span> ~ <span className="font-semibold">{new Date(banner.endDate).toISOString().split('T')[0]}</span></div>
                                            <div className="flex flex-row justify-end gap-6 mt-2">
                                                <div className="flex items-center justify-center px-2 py-0.5 cursor-pointer rounded-md text-sm bg-green-200" onClick={() => {
                                                    setModalState({ state: 'Update', banner: banner })
                                                }}
                                                >변경</div>
                                                <div className="flex items-center justify-center px-2 py-0.5 cursor-pointer rounded-md text-sm bg-red-200"
                                                    onClick={() => {
                                                        if (confirm('배너를 삭제하시겠습니까?')) bannerDeleteHadler(banner.id, 'PLANNED');
                                                    }}>삭제</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>}
                        <div className="font-semibold text-gray-400">종료된 배너</div>
                        {oldBanners.length == 0 ?
                            <div className="text-gray-300 flex flex-col justify-center self-center min-h-32">
                                <div>해당 되는 배너가 없습니다...</div>
                            </div>
                            :
                            <div className="w-full felx flex-col gap-4">
                                {oldBanners.map(banner => (
                                    <div key={banner.id} className="flex flex-row gap-8 px-12 justify-center">
                                        <div className="relative rounded-md overflow-hidden" style={{ height: 120, width: 360 }} >
                                            <img src={banner.bannerImgUrl} style={{ height: 120, width: '100%', objectFit: 'cover', objectPosition: 'center', }} />
                                        </div>
                                        <div className="flex flex-col gap-2 py-2">
                                            <div className="text-sm"> 배너 요청: <span className="text-sm font-semibold">{banner.owner}</span></div>
                                            <div className="text-sm"> 게시 날짜: <span className="text-sm font-semibold">{new Date(banner.startDate).toISOString().split('T')[0]}</span> ~ <span className="font-semibold">{new Date(banner.endDate).toISOString().split('T')[0]}</span></div>
                                            <div className="flex flex-row justify-end gap-6 mt-2">
                                                <div className="flex items-center justify-center px-2 py-0.5 cursor-pointer rounded-md text-sm bg-green-200"
                                                    onClick={() => {
                                                        setModalState({ state: 'Update', banner: banner })
                                                    }}
                                                >변경
                                                </div>
                                                <div className="flex items-center justify-center px-2 py-0.5 cursor-pointer rounded-md text-sm bg-red-200"
                                                    onClick={() => {
                                                        if (confirm('배너를 삭제하시겠습니까?')) bannerDeleteHadler(banner.id, 'OLD');
                                                    }}>삭제</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        }
                    </div>
                </div>
                <Modal isOpen={isLoading}>
                    <LoadingDots style="bg-transparent text-black" />
                </Modal>
                <CreateBannerModal isOpen={modalState?.state === "Create"} onClose={() => setModalState(null)} onSubmit={handleSubmitCreateBanner} />
                {modalState?.banner && <UpdateBannerModal isOpen={modalState.state === "Update"} onClose={() => setModalState(null)} onSubmit={handleSubmitUpdateBanner} banner={modalState.banner} />}
            </div>
        </>
    )
}


const CreateBannerModal
    : React.FC<{ isOpen: boolean, onSubmit: (event: React.FormEvent<HTMLFormElement>) => void, onClose: () => void }>
    = ({ isOpen, onSubmit, onClose }) => {

        const [bannerImgUri, setBannerImgUri] = useState<string | null>(null)

        const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            const maxSize = 512 * 1024; // 최대 파일 크기: 512kB

            if (file) {
                if (file.size > maxSize) {
                    alert('파일 크기는 2MB 이하로 업로드 해주세요.');
                    return;
                }
                const fileUrl = URL.createObjectURL(file); // 파일 URL 생성

                setBannerImgUri(fileUrl); // 미리보기 URL 설정
            }
        };

        return (
            <Modal isOpen={isOpen}>
                <div className="relative w-full flex flex-col bg-white">
                    <div className="absolute flex -top-0.5 flex-row-reverse w-full cursor-pointer" onClick={onClose}>X</div>
                    <div className="font-semibold">신규 배너 생성</div>
                    <form className='flex flex-col'
                        onSubmit={onSubmit}>
                        <div className='flex flex-col gap-6 mx-4 mt-6 mb-12'>
                            <div className='flex-row flex justify-between'>
                                신청자
                                <input
                                    className="outline-none border-b text-right px-2 "
                                    name='owner'
                                    type="text"
                                    required />
                            </div>
                            <div className='flex-row flex justify-between'>
                                시작 날짜
                                <input
                                    name='startDate'
                                    type="date"
                                    required />
                            </div>
                            <div className='flex-row flex justify-between'>
                                종료 날짜
                                <input
                                    name='endDate'
                                    type="date"
                                    required />
                            </div>

                            <div className='flex-row flex justify-between'>
                                연결 URL
                                <input name='banner-href' type="url" className='w-64 text-lg text-right px-2 outline-none border-b' />
                            </div>

                            <div className='flex-row flex justify-between'>
                                배너 이미지
                                <div className="flex flex-row-reverse gap-4">
                                    <label>
                                        <div className="px-2 py-1 rounded-md bg-gray-200">{bannerImgUri ? '이미지 변경' : '이미지 선택'}</div>
                                        <input required name='banner-image' type="file" accept=".jpeg, .png" src={bannerImgUri || ''} onChange={handleImageChange} className="hidden" />
                                    </label>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <div>미리보기</div>
                                <div className="relative self-center overflow-hidden" style={{ borderRadius: 15, borderWidth: 0.25, width: 360, height: 120 }}>
                                    {bannerImgUri ?
                                        <img src={bannerImgUri} className="relative rounded-md" style={{ height: 120, width: '100%', objectFit: 'cover', objectPosition: 'center', }} /> :
                                        <div>배너를 등록해주세요</div>}
                                </div>
                                <div className="text-gray-300 text-sm self-center">※ 해상도에 의해 다소 차이가 있을 수 있어요</div>
                            </div>
                        </div>
                        <div className="flex flex-row-reverse mb-2">
                            <button type="submit" className="px-2 py-1 flex text-white items-center justify-center rounded-sm bg-blue-300">저장</button>
                        </div>
                    </form>
                </div>
            </Modal>
        )
    }



const UpdateBannerModal
    : React.FC<{
        isOpen: boolean,
        banner: BannerDTO,
        onSubmit: ({ event, updatedPart, originBanner }:
            {
                event: React.FormEvent<HTMLFormElement>,
                updatedPart: { [key: string]: boolean },
                originBanner: BannerDTO
            }) => void,
        onClose: () => void
    }>
    = ({ isOpen, banner, onSubmit, onClose }) => {

        console.log(banner, '완')

        const [bannerImgUri, setBannerImgUri] = useState<string | null>(banner.bannerImgUrl)
        const [inputChageStatus, setInputChangeStatus] = useState<{ [key: string]: boolean }>({
            "owner": false,
            "startDate": false,
            "endDate": false,
            "banner-href": false,
            "banner-image": false
        }
        )

        const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            const maxSize = 512 * 1024; // 최대 파일 크기: 512kB

            if (file) {
                if (file.size > maxSize) {
                    alert('파일 크기는 2MB 이하로 업로드 해주세요.');
                    return;
                }
                const fileUrl = URL.createObjectURL(file); // 파일 URL 생성

                setBannerImgUri(fileUrl); // 미리보기 URL 설정
            }
        };
        const onSubmitHandler = (event: React.FormEvent<HTMLFormElement>) => {
            onSubmit({ event, updatedPart: inputChageStatus, originBanner: banner })
        }

        useEffect(() => {
            if (banner.bannerImgUrl != bannerImgUri)
                setInputChangeStatus({ ...inputChageStatus, "banner-image": true })
            else
                setInputChangeStatus({ ...inputChageStatus, "banner-image": false })
        }, [bannerImgUri])

        return (
            <Modal isOpen={isOpen}>
                <div className="relative w-full flex flex-col bg-white">
                    <div className="absolute flex -top-0.5 flex-row-reverse w-full cursor-pointer" onClick={onClose}>X</div>
                    <div className="font-semibold">배너 정보 수정</div>
                    <form className='flex flex-col'
                        onSubmit={onSubmitHandler}>
                        <div className='flex flex-col gap-6 mx-4 mt-6 mb-12'>
                            <div className='flex-row flex justify-between'>
                                신청자
                                <input
                                    className="outline-none border-b text-right px-2 "
                                    name='owner'
                                    type="text"
                                    defaultValue={banner.owner || ''}
                                    onChange={
                                        throttle((e) => {
                                            if (banner?.owner != e.currentTarget.value)
                                                setInputChangeStatus({ ...inputChageStatus, "owner": true })
                                            else
                                                setInputChangeStatus({ ...inputChageStatus, "owner": false })
                                        }, 100)
                                    }
                                    required />
                            </div>
                            <div className='flex-row flex justify-between'>
                                시작 날짜
                                <input
                                    name='startDate'
                                    type="date"
                                    defaultValue={banner.startDate.toISOString().split('T')[0] || ''}
                                    onChange={
                                        throttle((e) => {
                                            if (banner.startDate != e.currentTarget.value)
                                                setInputChangeStatus({ ...inputChageStatus, "startDate": true })
                                            else
                                                setInputChangeStatus({ ...inputChageStatus, "startDate": false })
                                        }, 100)
                                    }
                                    required />
                            </div>
                            <div className='flex-row flex justify-between'>
                                종료 날짜
                                <input
                                    name='endDate'
                                    type="date"
                                    defaultValue={banner.endDate.toISOString().split('T')[0] || ''}
                                    onChange={
                                        throttle((e) => {
                                            if (banner.endDate != e.currentTarget.value)
                                                setInputChangeStatus({ ...inputChageStatus, "endDate": true })
                                            else
                                                setInputChangeStatus({ ...inputChageStatus, "endDate": false })
                                        }, 100)
                                    }
                                    required />
                            </div>

                            <div className='flex-row flex justify-between'>
                                연결 URL
                                <input name='banner-href' type="url" className='w-64 text-lg text-right px-2 outline-none border-b'
                                    onChange={
                                        throttle((e) => {
                                            if (banner.href != e.currentTarget.value)
                                                setInputChangeStatus({ ...inputChageStatus, "banner-href": true })
                                            else
                                                setInputChangeStatus({ ...inputChageStatus, "banner-href": false })
                                        }, 100)
                                    }
                                    defaultValue={banner.href || ''} />
                            </div>

                            <div className='flex-row flex justify-between'>
                                배너 이미지
                                <div className="flex flex-row-reverse gap-4">
                                    <label>
                                        <div className="px-2 py-1 rounded-md bg-gray-200">{bannerImgUri ? '이미지 변경' : '이미지 선택'}</div>
                                        <input required={!bannerImgUri} name='banner-image' type="file" accept=".jpeg, .png" src={bannerImgUri || ''} onChange={handleImageChange} className="hidden" />
                                    </label>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <div>미리보기</div>
                                <div className="relative self-center overflow-hidden" style={{ borderRadius: 15, borderWidth: 0.25, width: 360, height: 120 }}>
                                    {bannerImgUri ?
                                        <img src={bannerImgUri} className="relative rounded-md" style={{ height: 120, width: '100%', objectFit: 'cover', objectPosition: 'center', }} /> :
                                        <div>배너를 등록해주세요</div>}
                                </div>
                                <div className="text-gray-300 text-sm self-center">※ 해상도에 의해 다소 차이가 있을 수 있어요</div>
                            </div>
                        </div>
                        <div className="flex flex-row-reverse mb-2">
                            {Object.values(inputChageStatus).some(value => value === true) ?
                                <button type="submit" className="px-2 py-1 flex text-white items-center justify-center rounded-sm bg-blue-300">저장</button> :
                                <div className="px-2 py-1 flex text-white items-center cursor-default justify-center rounded-sm bg-blue-100">저장</div>}
                        </div>
                    </form>
                </div>
            </Modal>
        )
    }

