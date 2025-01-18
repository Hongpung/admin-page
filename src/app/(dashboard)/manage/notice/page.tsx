'use server'
import { GET as loadInfos } from './load/route'
import NoticeClientComponent from './noticeClient';
import { Notice } from './types';
import "@admin/app/globals.css";

export default async function bannerManagePage() {
    const loadedInfos = await loadInfos();
    const initData = await loadedInfos.json() as Notice[];

    return (
        <div className="px-4 w-full h-full py-2">
            <NoticeClientComponent
                initNotices={initData}
            />
        </div>
    )
}