import React, { } from 'react';
import { ActionIcon, Alert, Card, Container, Flex, Group, LoadingOverlay, NavLink, Badge, ScrollArea, Stack, Text, Title, useMantineTheme, Tooltip } from '@mantine/core';
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
            return (<IconFileTypePdf size="1rem" color={hovered ? theme.colors.blue[8] : theme.colors.blue[6]} />)
        } else if (document.url.endsWith("htm") || document.url.endsWith("html")) {
            return (<IconFileTypeHtml size="1rem" color={hovered ? theme.colors.gray[8] : theme.colors.gray[6]} />)
        }
        return (<IconLink size="1rem" />)
    };

    let snippet: String
    try {
        snippet = document.description.substring(0, 750)
    }
    catch (err) {
        snippet = ""
    }
    const parts: string[] = document.url.split("/");
    const filename: string = parts[parts.length - 1];

    return (
        <div ref={ref}>
            <Tooltip label={document.title + " " + document.url + " "} position="top" offset={-20}>
                <Card bg={hovered ? theme.colors.gray[1] : theme.colors.gray[0]} ml={theme.spacing.md} sx={{ cursor: 'pointer' }} shadow={hovered ? 'md' : 'none'} component="a" onClick={() => { openDocument() }} target="_blank"
                    mb="sm">
                    {document.title != "Untitled" ?
                        <Group p="left" mb="0" >
                            <Text size="sm" c={hovered ? theme.colors.blue[8] : theme.colors.dark[8]}>{document.title}</Text>
                        </Group>
                        : null
                    }
                    {/* <Group mb="sm" p="0">
                    <Badge size="xs" variant="filled">{document.properties["entity"]["location"]}</Badge>
                    <Badge size="xs" variant="filled" color="pink">{document.properties["entity"]["aircraft"]}</Badge>
                    <Badge size="xs" variant="filled" color="teal">{document.properties["entity"]["dateAndTime"]}</Badge>
                </Group> */}
                    <Flex
                        gap="sm"
                        justify="flex-start"
                        align="flex-start"
                        direction="row"
                        p="md"
                    >
                        {icon()}
                        <Text size="xs" color="gray.7">{filename}</Text>
                    </Flex>
                    {/* <Text size="sm" color="gray.9">
                    {snippet}...
                </Text> */}
                </Card >
            </Tooltip>
        </div >
    );
}

export const DocList = ({ documents, settings, docsLoading }: { documents: SearchResultDocument[], settings: Settings, docsLoading: boolean }) => {
    const theme = useMantineTheme();
    const icon = <IconInfoCircle />;

    return (
        <Container bg="white">
            {/* <Container>
                <Alert variant="light" color="green" title="Important" radius="md" icon={icon}>
                    Always refer to the original source document to consider warnings and important notices.
                </Alert>
            </Container> */}
            <ScrollArea.Autosize pb="0" w="20rem">
                <Container>
                    <LoadingOverlay visible={docsLoading} overlayBlur={2} />
                    <Flex
                        // bg="rgba(0, 0, 0, .3)"
                        gap="sm"
                        justify="flex-start"
                        align="flex-start"
                        direction="row"
                        wrap="nowrap"
                    >
                        {documents.map(document => (
                            < DocumentItem
                                key={document.id + Math.random()}
                                document={document}
                            />
                        )
                        )
                        }
                    </Flex>
                </Container>
            </ScrollArea.Autosize>
        </Container >
    );
}