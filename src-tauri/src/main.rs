#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use anyhow::Result;
use keyring::Entry;
use serde::{Deserialize, Serialize};
use std::fs::File;
use std::io::Write;
use std::path::Path;
use tauri::State;
use thiserror::Error;
use zip::write::FileOptions;

#[derive(Debug, Error)]
enum AppError {
    #[error("{0}")]
    Message(String),
    #[error(transparent)]
    Other(#[from] anyhow::Error),
}

impl From<AppError> for String {
    fn from(value: AppError) -> Self {
        value.to_string()
    }
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RenderedFile {
    path: String,
    contents: String,
}

#[derive(Default)]
struct SecureContext;

#[tauri::command]
fn save_token(_state: State<'_, SecureContext>, service: String, account: String, token: String) -> Result<(), String> {
    Entry::new(&service, &account)
        .map_err(|err| AppError::Message(format!("Erro ao abrir credencial: {err}")))?
        .set_password(&token)
        .map_err(|err| AppError::Message(format!("Erro ao salvar credencial: {err}")))?;
    Ok(())
}

#[tauri::command]
fn load_token(_state: State<'_, SecureContext>, service: String, account: String) -> Result<Option<String>, String> {
    let entry = Entry::new(&service, &account)
        .map_err(|err| AppError::Message(format!("Erro ao abrir credencial: {err}")))?;
    match entry.get_password() {
        Ok(token) => Ok(Some(token)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(err) => Err(AppError::Message(format!("Erro ao ler credencial: {err}")).into()),
    }
}

#[tauri::command]
fn delete_token(_state: State<'_, SecureContext>, service: String, account: String) -> Result<(), String> {
    let entry = Entry::new(&service, &account)
        .map_err(|err| AppError::Message(format!("Erro ao abrir credencial: {err}")))?;
    match entry.delete_password() {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(err) => Err(AppError::Message(format!("Erro ao remover credencial: {err}")).into()),
    }
}

#[tauri::command]
fn export_rendered_zip(files: Vec<RenderedFile>, output_path: String) -> Result<(), String> {
    create_rendered_zip(files, output_path).map_err(|err| AppError::Other(err).into())
}

fn create_rendered_zip(files: Vec<RenderedFile>, output_path: String) -> Result<()> {
    let path = Path::new(&output_path);
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    let file = File::create(path)?;
    let mut zip = zip::ZipWriter::new(file);
    let options = FileOptions::default().compression_method(zip::CompressionMethod::Deflated);

    for file in files {
        zip.start_file(file.path, options)?;
        zip.write_all(file.contents.as_bytes())?;
    }

    zip.finish()?;
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .manage(SecureContext::default())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_os::init())
        .invoke_handler(tauri::generate_handler![
            save_token,
            load_token,
            delete_token,
            export_rendered_zip
        ])
        .run(tauri::generate_context!())
        .expect("error while running simplehtml");
}
