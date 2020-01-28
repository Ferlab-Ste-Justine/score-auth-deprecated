export NAME=$(cat ./src/package.json | jq -r ".name")
export VERSION=$(cat ./src/package.json | jq -r ".version")
export IMAGE=chusj/$NAME:$VERSION

(cd src; docker build -t $IMAGE .)

docker push $IMAGE