// INTEGRAÇÕES (MOCKS)
// Como não temos IA nem Email no PHP básico, criamos funções vazias para não quebrar o site.

const notImplemented = (featureName) => async () => {
    console.warn(`A função ${featureName} ainda não foi migrada para o PHP.`);
    alert(`Atenção: A funcionalidade '${featureName}' precisa ser recriada na HostGator.`);
    return null;
};

export const Core = {
    InvokeLLM: notImplemented("Inteligência Artificial (LLM)"),
    SendEmail: notImplemented("Enviar Email"),
    UploadFile: notImplemented("Upload de Arquivo"),
    GenerateImage: notImplemented("Gerar Imagem"),
    ExtractDataFromUploadedFile: notImplemented("Ler Arquivo"),
    CreateFileSignedUrl: notImplemented("Link de Arquivo"),
    UploadPrivateFile: notImplemented("Arquivo Privado")
};

// Exportando individualmente também, para manter compatibilidade
export const InvokeLLM = Core.InvokeLLM;
export const SendEmail = Core.SendEmail;
export const UploadFile = Core.UploadFile;
export const GenerateImage = Core.GenerateImage;
export const ExtractDataFromUploadedFile = Core.ExtractDataFromUploadedFile;
export const CreateFileSignedUrl = Core.CreateFileSignedUrl;
export const UploadPrivateFile = Core.UploadPrivateFile;