import { GET as loadInfos } from './load/route'
import NoticeClientComponent from './noticeClient';
import { Info } from './types';

export default async function bannerManagePage() {
    const loadedInfos = await loadInfos();
    const initData = await loadedInfos.json() as Info[];

    return (
        <div className="px-4 w-full h-full py-2">
            <NoticeClientComponent
                initInfos={initData}
            >
            </NoticeClientComponent>
        </div>
    )
}