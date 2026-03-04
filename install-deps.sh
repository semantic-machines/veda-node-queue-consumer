#!/bin/bash

set -e

VEDA_SERVER_REPO="https://github.com/semantic-machines/veda-server"
VEDA_SERVER_BRANCH="master"
LIB_REMOTE_PATH="source/lib64/libxapianm/.libs/libxapianm.so.22.7.3"
LIB_NAME="libxapianm.so.22.7.3"
LIB_INSTALL_DIR="/usr/local/lib"

detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        echo "$ID"
    else
        echo "unknown"
    fi
}

install_libxapianm() {
    DOWNLOAD_URL="https://raw.githubusercontent.com/semantic-machines/veda-server/$VEDA_SERVER_BRANCH/$LIB_REMOTE_PATH"

    echo "Загрузка $LIB_NAME..."

    TMP_FILE=$(mktemp)
    trap "rm -f $TMP_FILE" EXIT

    curl -fL --progress-bar -o "$TMP_FILE" "$DOWNLOAD_URL"

    echo "Установка $LIB_NAME в $LIB_INSTALL_DIR..."
    sudo cp "$TMP_FILE" "$LIB_INSTALL_DIR/$LIB_NAME"
    sudo chmod 755 "$LIB_INSTALL_DIR/$LIB_NAME"

    sudo ln -sf "$LIB_INSTALL_DIR/$LIB_NAME" "$LIB_INSTALL_DIR/libxapianm.so.22"
    sudo ln -sf "$LIB_INSTALL_DIR/$LIB_NAME" "$LIB_INSTALL_DIR/libxapianm.so"

    # Регистрируем /usr/local/lib в путях поиска линкера
    echo "/usr/local/lib" | sudo tee /etc/ld.so.conf.d/local.conf > /dev/null
    sudo ldconfig

    echo "libxapianm успешно установлена."
    echo "Проверка: $(ldconfig -p | grep xapianm || echo 'ВНИМАНИЕ: библиотека не найдена в кэше ldconfig')"
}

OS=$(detect_os)

echo "Обнаружена ОС: $OS"

case "$OS" in
    ubuntu|debian)
        echo "Установка системных зависимостей для $OS..."
        sudo apt-get update -y
        sudo apt-get install -y pkg-config libssl-dev build-essential cmake curl
        ;;
    redos)
        echo "Установка системных зависимостей для RedOS..."
        sudo dnf install -y pkg-config openssl-devel gcc make cmake curl
        ;;
    *)
        echo "Неизвестная или неподдерживаемая ОС: $OS"
        echo "Поддерживаемые ОС: ubuntu, debian, redos"
        exit 1
        ;;
esac

echo "Системные зависимости успешно установлены."

install_libxapianm

echo ""
echo "Все зависимости установлены. Для сборки проекта выполните:"
echo "  npm run build-release"
echo ""
echo "Если линкер всё равно не находит libxapianm, используйте:"
echo "  RUSTFLAGS='-L /usr/local/lib' npm run build-release"
