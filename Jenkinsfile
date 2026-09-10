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
                sh "npm ci"
            }
        }

        stage('build and push') {
            steps {
                echo "building docker image and pushing"
                sh 'docker build -t holiday-class/${JOB_NAME}:${BUILD_NUMBER}'
            }
        }

        stage('deploy') {
            steps {
                echo "deploy the new version"
                sh '''
                    docker rm holiday_class || true
                    docker run -d --name holiday_class -p 3000:3000 holiday_jenkins:latest
                '''
            }
        }

        post {
            success { echo "CICD poiplene deployment successfuly" }
            failure { echo "Failed to deploy" }
        }
    }
}