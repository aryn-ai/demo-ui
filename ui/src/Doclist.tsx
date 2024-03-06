import React, { } from 'react';
import { ActionIcon, Alert, Card, Container, Flex, Group, LoadingOverlay, NavLink, Badge, ScrollArea, Stack, Text, Title, useMantineTheme } from '@mantine/core';
import { useHover } from '@mantine/hooks';
import { IconInfoCircle, IconFileTypeHtml, IconLink, IconFileTypePdf } from '@tabler/icons-react';
import { SearchResultDocument, Settings } from './Types';

// const DocumentItem = ({ index, title, description, url, relevanceScore, properties }: SearchResultDocument) => {
const DocumentItem = ({ document }: { document: SearchResultDocument }) => {
    const theme = useMantineTheme();
    const { hovered, ref } = useHover();
    const openDocument = () => {
        if (document.isPdf()) {
            const dataString = JSON.stringify(document);
            console.log("You clicked: ", document)
            localStorage.setItem('pdfDocumentMetadata', dataString);
            window.open('/viewPdf');
        } else {
            window.open(document.url);
        }
    }
    function icon() {
        if (document.isPdf()) {
            return (<IconFileTypePdf size="1.125rem" color={hovered ? theme.colors.blue[8] : theme.colors.blue[6]} />)
        } else if (document.url.endsWith("htm") || document.url.endsWith("html")) {
            return (<IconFileTypeHtml size="1.125rem" color={hovered ? theme.colors.gray[8] : theme.colors.gray[6]} />)
        }
        return (<IconLink size="1.125rem" />)
    };

    let snippet: String
    try {
        snippet = document.description.substring(0, 750)
    }
    catch (err) {
        snippet = ""
    }

    return (
        <div ref={ref}>
            <Card ml={theme.spacing.xl} maw="calc(100vw - 60rem);" sx={{ cursor: 'pointer' }} shadow={hovered ? 'md' : 'none'} component="a" onClick={() => { openDocument() }} target="_blank">
                <Group p="left" mb="0" >
                    <Title order={5} mb="0" c={hovered ? theme.colors.blue[8] : theme.colors.dark[8]}>{document.index}. {document.title}</Title>
                    {icon()}
                </Group>
                {/* <Group mb="sm" p="0">
                    <Badge size="xs" variant="filled">{document.properties["entity"]["location"]}</Badge>
                    <Badge size="xs" variant="filled" color="pink">{document.properties["entity"]["aircraft"]}</Badge>
                    <Badge size="xs" variant="filled" color="teal">{document.properties["entity"]["dateAndTime"]}</Badge>
                </Group> */}
                <Group mb="sm">
                    <Text size="xs" color="gray.7">Relevance score: {document.relevanceScore}</Text>
                </Group>
                <Text size="sm" color="gray.9">
                    {snippet}...
                </Text>
            </Card >
        </div >
    );
}

export const DocList = ({ documents, settings, docsLoading }: { documents: SearchResultDocument[], settings: Settings, docsLoading: boolean }) => {
    const theme = useMantineTheme();
    const icon = <IconInfoCircle />;

    return (
        <Container bg="white">
            <Container>
                <Alert variant="light" color="green" title="Important" radius="md" icon={icon}>
                    Always refer to the original source document to consider warnings and important notices.
                </Alert>
            </Container>
            <ScrollArea.Autosize pb="0" h="calc(100vh - 12rem);">
                <LoadingOverlay visible={docsLoading} overlayBlur={2} />
                <Stack>
                    {documents.map(document => (
                        < DocumentItem
                            key={document.id + Math.random()}
                            document={document}
                        />
                    )
                    )
                    }
                </Stack>
            </ScrollArea.Autosize>
        </Container >
    );
}