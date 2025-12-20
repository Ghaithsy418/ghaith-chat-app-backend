export const createPhotoUrl = (photoUrl: string)=> {
    return `${process.env.BACKEND_URL}/images/${photoUrl}`
}