export NAME=$(cat ./src/package.json | jq -r ".name")
export IMAGE=chusj/$NAME:dev

(cd src; docker build -t $IMAGE -f Dockerfile-dev .)