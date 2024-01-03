export default function BlimpCamera({ url } : { url: string }) {
    return (
        <img style={{width: '100%', objectFit: 'contain'}} src={url}/>
    )
}
