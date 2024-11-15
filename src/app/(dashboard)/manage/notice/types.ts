export interface Info {
    infoId: number
    title: string
    date: string
}

export interface infoDetail extends Info {
    content: string
}