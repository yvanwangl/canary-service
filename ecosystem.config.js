module.exports = {
    apps: [
        {
            name: "canary-service",
            script: "./build/bin/www.js",
            watch: true,
            env: {
                "PORT": 9000,
                "NODE_ENV": "development"
            },
            env_production: {
                "PORT": 9000,
                "NODE_ENV": "production",
                "MONGODB_HOST": '',
                "MONGODB_DATABASE":'',
                "MONGODB_PORT":'',
                "MONGODB_USER":'',
                "MONGODB_PWD":'',
                "SERVER_HOST":'',
                "QINIU_DOUPLOAD":'',
                "QINIU_PUBLIC_BUCKET_DOMAIN":'',
                "QINIU_ACCESS_KEY":'',
                "QINIU_SECRET_KEY":'',
                "QINIU_BUCKET":'',
                "EMAIL_HOST":'',
                "EMAIL_PORT":'',
                "EMAIL_USER":'',
                "EMAIL_PASS":'',
                "REGISTOR":''
            }
        }
    ]
};