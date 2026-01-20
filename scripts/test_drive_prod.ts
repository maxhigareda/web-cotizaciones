import { google } from 'googleapis'
import { Readable } from 'stream'

async function main() {
    console.log("Testing Limit-Testing Production Drive Upload...")

    const CLIENT_EMAIL = "web-cotizador@web-cotizador.iam.gserviceaccount.com"
    const FOLDER_ID = "1cQ-zw52TN05r76PZvsnKSMDwJ_c_Tyum"
    const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDiH/OqrUi9m/tv
7BvCx6hXMH/31JC8csU6xVqcJ6egKUvwIKDkpGZd8acOaNBtLWpSp4p5eVQ630k1
90UEyZEyOLkoPNyd7/bajWzjSWf2vAzuZtkZIKFiV/tEtY/60IUr2uMrInfSwBaG
gvnAnlGdNEiGXUrD2UMA2XcP3jYnhltICtDYvcvYQzSEwZd0CtpqYTaMo+QBTJd9
aYcgHlZ2ZFWkspheJ5HVKYOQrMxn2iDItXlC0P20+mrbsnjIOz58WuxXPeYUwQxP
A7cpJ6iLSTCEBXl+Jne9bIbj+vk8jhmcbp3dH9l3qNK8qMY41vU9jloCiZD6Oyww
RmCr3mgvAgMBAAECggEAPzHVy8fE0fTDRsqyEXPyCHft84mM75WVqDCae5SbhKe1
6MR9opiNYUjVOrIxOandEn9vNDajwxY+5B2YRNe+Q85VdLjZoSv8jaTDnxuXOf3h
EUld9+dGIvFasB+bvulCpnh0T0xBN31mbi4xdVLplSkU8bQl3mkcECM2YpFkChQ8
dHHb/QvD/ljH7QcHsTGj4Lpzpmh1/J1o2lShVvnYWpROFWX9aHaFWIJ3PsyKxRJN
hu7XZewWV2yKd1/KSXBKz0xEAMmluAvs9pLj6hstRn+k0EPc2cvCl7IKNNWADdpo
aWj56CcDOcnHdnYg6EO2Lcf1dkA6Tpnzny9cX3JxVQKBgQD0LLLTWsx+uXxx2yiP
k+3tEATE5qwnmdKFy4kNxNn7YpffCvjS+5NMVtTG1bom58DELwfSaQSv4NY5aHxK
vGWi7cH0vtSylqHBvttuM+ceb22cn7o+ZakxMzIP7g9qNwVDP9hOJnS+09BLOBjd
i9PXPM5nmreydr86ltcKvIvo/QKBgQDtE3ha/KusUUzePgQAoAecYnv4pj0dCOT0
FnNEfj4Rgl0FQZrtDZk+N8iXSBQ0cacPwAwz/wUG5OF5cONJH7kQCsGYQ00tPDJT
/2zX7mGKmHdEBvKtLPUcZGk/c6nW3BJT4wH80BK4D7cM5jEcMoj2xqM00MBQH3kz
eqhDntDjmwKBgBa5Li8zLQLCGk2yOpUaDDNaoUb9vJm22/utlGSepDab10xfhgaE
eRHKpuSWMUu7l5nqUo0HTvNbNjSDf8WowMCn5bv0InE4SXdxXpRj6idP8WB5EOkL
pvI4NHl9Cxw0YJ4AjA3B0G2N4r2NS+saPy2xr/e+U0gdevBl5z9Niqu1AoGBAIW5
0M7J7XASn+BQbOOJYSGmL7WO17QT+0lvjG9bIlmwBhZb7i6+1+zPfHdQ8gyu+wQY
WQnPVJ+R5VkiAyKRIUtaNd9UPyk/5keZMWUPkrehzsxxetuSG2R7gx6GeIu4sSHe
T5WyLIzkWGWPRq5YFwfT/eVhxsirKCuQiW8zGzL3AoGBAKCDln2KteyZnPZnjU8R
8BdbMllqE5kFMw4Oo/7d1ZQU3SC6uTKYy3QNMl1qhcAzAJDBVoi7LHaMcFe4jtQN
nZv5OspyaJKDsx84xn8prD77Mt/9dmEs4duJtSD3Vb05SGbGx4nC2DdVJmWSxGiD
d69oSj3XHfF51+oC6L5hrj6m
-----END PRIVATE KEY-----`

    try {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: CLIENT_EMAIL,
                private_key: PRIVATE_KEY,
            },
            scopes: ['https://www.googleapis.com/auth/drive.file'],
        })

        const drive = google.drive({ version: 'v3', auth })

        const content = "Test Upload from Verification Script"
        const stream = new Readable()
        stream.push(content)
        stream.push(null)

        const response = await drive.files.create({
            requestBody: {
                name: "TEST_VERIFICATION_UPLOAD.txt",
                parents: [FOLDER_ID],
            },
            media: {
                mimeType: 'text/plain',
                body: stream,
            },
        })

        console.log("SUCCESS! File created with ID:", response.data.id)

    } catch (e: any) {
        console.error("FAILURE:", e.message)
        if (e.message.includes('insufficientFilePermissions')) {
            console.error("DIAGNOSIS: The Service Account does not have 'Editor' access to the folder.")
            console.error(`Please Share folder ${FOLDER_ID} with ${CLIENT_EMAIL}`)
        }
    }
}

main()
