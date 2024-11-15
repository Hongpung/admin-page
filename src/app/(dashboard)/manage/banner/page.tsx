import BannerManageClientPage from "./clientPage";
import { loadActiveBanners, loadOldBanners, loadPlannedBanners } from "./backUtils";

export default async function bannerManagePage() {
    const loadedOldBanners = await loadOldBanners() || [];
    const loadedActiveBanners = await loadActiveBanners()|| [];
    const loadedPlannedBanners = await loadPlannedBanners()|| [];

    return (
        <BannerManageClientPage
            initActiveBanners={loadedActiveBanners}
            initOldBanners={loadedOldBanners}
            initPlannedBanners={loadedPlannedBanners}
        >
        </BannerManageClientPage>
    )
}