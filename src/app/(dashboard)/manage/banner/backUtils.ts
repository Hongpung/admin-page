import { collection, getDocs, query, where } from "firebase/firestore";
import firestore from "@Firebase/firestore";
import { BannerDTO } from "./types";

export async function loadOldBanners() {
    try {
        const fbQuery =
            query(
                collection(firestore, 'banners'),
                where('endDate', '<', new Date())
            )

        const docRef = await getDocs(fbQuery);

        const docsData = docRef.docs.map(doc => {
            const data = doc.data();

            if (data.startDate && data.startDate.toDate) {
                data.startDate = data.startDate.toDate(); // Timestamp -> Date
            }
            if (data.endDate && data.endDate.toDate) {
                data.endDate = data.endDate.toDate(); // Timestamp -> Date
            }

            return {
                id: doc.id,
                ...data
            };
        });

        return docsData as BannerDTO[];
        
    } catch (e) {
        console.error(e);
        return null;
    }
}

export async function loadPlannedBanners() {
    try {
        const fbQuery =
            query(
                collection(firestore, 'banners'),
                where('startDate', '>', new Date()),
            )

        const docRef = await getDocs(fbQuery);

        const docsData = docRef.docs.map(doc => {
            const data = doc.data();

            if (data.startDate && data.startDate.toDate) {
                data.startDate = data.startDate.toDate(); // Timestamp -> Date
            }
            if (data.endDate && data.endDate.toDate) {
                data.endDate = data.endDate.toDate(); // Timestamp -> Date
            }

            return {
                id: doc.id,
                ...data
            };
        });

        return docsData as BannerDTO[];
    } catch (e) {
        console.error(e);
        return null;
    }
}

export async function loadActiveBanners() {
    try {
        const fbQuery =
            query(
                collection(firestore, 'banners'),
                where('startDate', '<=', new Date()),
                where('endDate', '>=', new Date())
            )

        const docRef = await getDocs(fbQuery);

        const docsData = docRef.docs.map(doc => {
            const data = doc.data();

            if (data.startDate && data.startDate.toDate) {
                data.startDate = data.startDate.toDate(); // Timestamp -> Date
            }
            if (data.endDate && data.endDate.toDate) {
                data.endDate = data.endDate.toDate(); // Timestamp -> Date
            }

            return {
                id: doc.id,
                ...data
            };
        });

        return docsData as BannerDTO[];
    } catch (e) {
        console.error(e);
        return null;
    }
}