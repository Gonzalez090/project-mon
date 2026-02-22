/** @type {import('next').NextConfig} */
const nextConfig = {
env : {
    'MYSQL_HOST' : 'localhost',
    'MYSQL_PORT' : '3306',
    'MYSQL_USER' : 'root',
    'MYSQL_PASSWORD' : '',
    'MYSQL_DATABASE' : 'ebd_id_project_tue',
}
};


export default nextConfig;