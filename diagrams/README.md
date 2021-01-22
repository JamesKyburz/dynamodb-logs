# diagrams

## You will need to install

- [python 3.8.6](https://www.python.org/downloads/release/python-386)

# setup

```sh
pip3 install virtualenv
virtualenv venv
. venv/bin/activate
python3 install -r requirements.txt
```

# create diagrams

```sh
. venv/bin/activate
find . -maxdepth 1 -name "*.py" -exec python {} \;
```
