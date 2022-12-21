/**
 * @param {{params : any}} params
 */
export function load({ params }) {
    return {
        page: params.slug
    };
}