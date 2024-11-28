
import { loadBanners } from "./backUtils";
import BannerManageClientPage from "./clientPage";
import "@admin/app/globals.css";

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