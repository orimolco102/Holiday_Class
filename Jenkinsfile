pipeline {
    agent any

    stages {
        stage('checkout') {
            steps {
                echo "pull from github"
                checkout scm
            }
        }
    
        stage('install') {
            steps {
                echo "installing dependecies"
                bat "npm ci"
            }
        }

        stage('build') {
            steps {
                bat 'docker build -t holiday_class:latest .'
            }
        }

        stage('deploy') {
            steps {
                bat '''
                    docker rm -f holiday_class || true
                    docker run -d --name holiday_class -p 3000:3000 holiday_class:latest
                '''
            }
        }

            }

    post {
        success { echo "CICD poiplene deployment successfuly!" }
        failure { echo "Failed to deploy" }
    }

}