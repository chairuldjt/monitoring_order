import { NextResponse } from 'next/server';
import { getPayloadFromCookie } from '@/lib/jwt';
import { getSIMRSOrderPhotos } from '@/lib/simrs-client';

/**
 * GET /api/orders/[id]/photos — Fetch photos for a specific order LIVE from SIMRS
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Optional: Check auth for this endpoint
        // const payload = await getPayloadFromCookie();
        // if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const photos = await getSIMRSOrderPhotos(id);

        return NextResponse.json({
            data: photos.map((p: any) => ({
                id: p.id || Math.random(),
                thumbnail: p.thumbnail || p.image_url || '',
                full: p.image_url || '',
                created_at: p.create_date || '',
                user_name: p.user_name || '',
            }))
        });
    } catch (error: any) {
        console.error('Order photos error:', error);
        return NextResponse.json({ error: 'Gagal mengambil foto order: ' + error.message }, { status: 500 });
    }
}
