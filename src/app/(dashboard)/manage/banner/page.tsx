
import { loadBanners } from "./backUtils";
import BannerManageClientPage from "./clientPage";
import "@admin/app/globals.css";

export const dynamic = "force-dynamic"; 

export default async function bannerManagePage() {
    const {AfterPost:loadedOldBanners, OnPost:loadedActiveBanners, BeforePost:loadedPlannedBanners} = await loadBanners()
    
    return (
        <BannerManageClientPage
            initActiveBanners={loadedActiveBanners}
            initOldBanners={loadedOldBanners}
            initPlannedBanners={loadedPlannedBanners}
        >
        </BannerManageClientPage>
    )
}