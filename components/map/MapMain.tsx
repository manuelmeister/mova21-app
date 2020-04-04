import React from 'react';
import {Text} from 'react-native';
import styled from "styled-components/native";

const MainContainer = styled.View`
	flex: 1;
	background-color: #fff;
	align-items: center;
	justify-content: center;
`;

export default function MapMain() {
	return (
		<MainContainer>
			<Text>Map</Text>
		</MainContainer>
	);
}
